import Foundation
import Security

// MARK: - ClaudeService
// Calls api.anthropic.com directly from the device — no backend required.
// The API key is stored in the iOS Keychain.

final class ClaudeService: @unchecked Sendable {

    static let shared = ClaudeService()
    private init() {}

    private let keychainKey = "com.instructorbuddy.anthropic_key"
    private let endpoint    = URL(string: "https://api.anthropic.com/v1/messages")!
    private let model       = "claude-opus-4-5"

    // MARK: - API key (Keychain-backed)

    var apiKey: String {
        get { keychainGet(keychainKey) ?? "" }
        set {
            if newValue.isEmpty { keychainDelete(keychainKey) }
            else                { keychainSet(keychainKey, value: newValue) }
        }
    }

    var hasAPIKey: Bool { !apiKey.isEmpty }

    // MARK: - Analyse a single frame

    func analyzeFrame(
        imageBase64: String,
        keypoints:   [PoseKeypoint],
        focusArea:   FocusArea,
        skillLevel:  SkillLevel,
        frameIndex:  Int,
        totalFrames: Int
    ) async throws -> CoachingResult {

        guard hasAPIKey else { throw ClaudeError.noAPIKey }

        let body: [String: Any] = [
            "model":      model,
            "max_tokens": 1024,
            "system":     systemPrompt(skillLevel: skillLevel),
            "messages": [[
                "role": "user",
                "content": [
                    [
                        "type": "image",
                        "source": [
                            "type":       "base64",
                            "media_type": "image/jpeg",
                            "data":        imageBase64
                        ]
                    ],
                    [
                        "type": "text",
                        "text": userPrompt(
                            keypoints:   keypoints,
                            focusArea:   focusArea,
                            skillLevel:  skillLevel,
                            frameIndex:  frameIndex,
                            totalFrames: totalFrames
                        )
                    ]
                ]
            ]]
        ]

        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.setValue(apiKey,             forHTTPHeaderField: "x-api-key")
        req.setValue("2023-06-01",       forHTTPHeaderField: "anthropic-version")
        req.httpBody       = try JSONSerialization.data(withJSONObject: body)
        req.timeoutInterval = 60

        let (data, response) = try await URLSession.shared.data(for: req)

        guard let http = response as? HTTPURLResponse else { throw ClaudeError.invalidResponse }

        switch http.statusCode {
        case 200...299: break
        case 401:       throw ClaudeError.invalidAPIKey
        default:
            let msg = String(data: data, encoding: .utf8) ?? "HTTP \(http.statusCode)"
            throw ClaudeError.apiError(http.statusCode, msg)
        }

        // Pull the text out of the Anthropic response envelope
        guard let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let content  = envelope["content"] as? [[String: Any]],
              let textBlock = content.first(where: { $0["type"] as? String == "text" }),
              let text      = textBlock["text"] as? String
        else { throw ClaudeError.invalidResponse }

        return try parseResult(from: text)
    }

    // MARK: - Prompts

    private func systemPrompt(skillLevel: SkillLevel) -> String {
        """
        You are a PSIA Level III certified ski instructor analysing a video frame to give coaching feedback.

        Rules:
        - Maximum 2 observations per frame (primary required, secondary optional)
        - Coaching cue must be ≤12 words and immediately actionable
        - Reference specific body positions visible in the image
        - Calibrate language for a \(skillLevel.label) skier

        Respond ONLY with a single JSON object — no markdown, no prose — matching this schema exactly:
        {
          "primary_observation": { "text": "...", "confidence": 0.0–1.0, "body_region": "knees|hips|shoulders|arms|overall" },
          "secondary_observation": { "text": "...", "confidence": 0.0–1.0, "body_region": "..." } | null,
          "cue": "≤12 word actionable coaching cue",
          "overlays": [
            {
              "id": "unique-string",
              "type": "angle|line|arrow|circle|text",
              "color": "#RRGGBB",
              "label": "optional string or null",
              "landmarks": [mediapipe_joint_id_ints],
              "value": null_or_number,
              "dash_pattern": null_or_[on,off],
              "radius": null_or_number
            }
          ]
        }
        """
    }

    private func userPrompt(
        keypoints:   [PoseKeypoint],
        focusArea:   FocusArea,
        skillLevel:  SkillLevel,
        frameIndex:  Int,
        totalFrames: Int
    ) -> String {
        let joints = keypoints
            .filter { $0.visibility > 0.3 }
            .map { "id:\($0.id) x:\(String(format: "%.3f", $0.x)) y:\(String(format: "%.3f", $0.y))" }
            .joined(separator: "  ")

        return """
        Frame \(frameIndex + 1) of \(totalFrames) | Focus: \(focusArea.label) | Level: \(skillLevel.label)

        Visible pose keypoints (normalised 0–1, top-left origin, MediaPipe IDs):
        \(joints.isEmpty ? "none detected" : joints)

        Analyse the image and return JSON coaching feedback.
        """
    }

    // MARK: - Parse

    private func parseResult(from text: String) throws -> CoachingResult {
        // Strip optional markdown fences (```json … ```)
        var clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.hasPrefix("```") {
            clean = clean
                .components(separatedBy: "\n")
                .dropFirst()           // remove ```json line
                .joined(separator: "\n")
            if clean.hasSuffix("```") {
                clean = String(clean.dropLast(3))
            }
        }

        // Find the first { … } block
        guard let start = clean.firstIndex(of: "{"),
              let data  = String(clean[start...]).data(using: .utf8)
        else { throw ClaudeError.parseError }

        do {
            return try JSONDecoder().decode(CoachingResult.self, from: data)
        } catch {
            throw ClaudeError.parseError
        }
    }

    // MARK: - Keychain helpers

    private func keychainSet(_ key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        keychainDelete(key)
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecValueData:   data
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    private func keychainGet(_ key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecReturnData:  true,
            kSecMatchLimit:  kSecMatchLimitOne
        ]
        var out: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess,
              let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }

    private func keychainDelete(_ key: String) {
        let query: [CFString: Any] = [kSecClass: kSecClassGenericPassword, kSecAttrAccount: key]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Errors

enum ClaudeError: LocalizedError {
    case noAPIKey
    case invalidAPIKey
    case invalidResponse
    case parseError
    case apiError(Int, String)

    var errorDescription: String? {
        switch self {
        case .noAPIKey:               return "No API key set. Add your Anthropic key in Settings."
        case .invalidAPIKey:          return "Invalid API key — check Settings."
        case .invalidResponse:        return "Unexpected response from Claude API."
        case .parseError:             return "Could not parse Claude's coaching response."
        case .apiError(let c, let m): return "Claude API error \(c): \(m)"
        }
    }
}
