import Foundation

enum APIError: LocalizedError {
    case missingAPIKey
    case badHTTPStatus(Int)
    case noContent
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:       return "Anthropic API key not found in Config.plist"
        case .badHTTPStatus(let c): return "API returned HTTP \(c)"
        case .noContent:           return "API response contained no text content"
        case .decodingFailed(let m): return "Could not decode response: \(m)"
        }
    }
}

struct ClaudeAPIService {

    // MARK: — System prompt — instructs Claude to return raw JSON only
    private static let systemPrompt = """
    You are HUMAN, an AI that helps people understand complex content. \
    Your job is to make the confusing clear, the dense accessible, \
    and the overwhelming navigable — for the specific person in front of you.

    Given any user input — a question, confusing text, a concept, or anything \
    they're trying to figure out — respond ONLY with a valid JSON object. \
    No markdown fences. No preamble. No explanation outside the JSON.

    The JSON must have exactly these keys:
    {
      "before": "A representative dense or complex excerpt from what they shared, \
    or a brief plain-English acknowledgment of their situation if no complex text was given. \
    Max 200 words.",
      "after": "A warm, plain-language explanation that uses everyday analogies and \
    storytelling. Wrap the 2-3 most important phrases in **double asterisks** for emphasis. \
    Write as if pulling up a chair next to them. Max 150 words.",
      "chips": [
        "follow-up question 1",
        "follow-up question 2",
        "follow-up question 3",
        "follow-up question 4"
      ]
    }
    """

    // MARK: — Main API call
    static func fetchExplanation(for userInput: String) async throws -> ClaudeResponse {
        let apiKey = try loadAPIKey()

        guard let url = URL(string: "https://api.anthropic.com/v1/messages") else {
            throw APIError.noContent
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json",  forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey,              forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01",        forHTTPHeaderField: "anthropic-version")

        let body: [String: Any] = [
            "model": "claude-opus-4-5",
            "max_tokens": 1024,
            "system": systemPrompt,
            "messages": [
                ["role": "user", "content": userInput]
            ]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw APIError.badHTTPStatus(0)
        }
        guard http.statusCode == 200 else {
            throw APIError.badHTTPStatus(http.statusCode)
        }

        // Parse outer envelope
        let envelope: AnthropicAPIResponse
        do {
            envelope = try JSONDecoder().decode(AnthropicAPIResponse.self, from: data)
        } catch {
            throw APIError.decodingFailed("envelope: \(error.localizedDescription)")
        }

        guard let textBlock = envelope.content.first(where: { $0.type == "text" }) else {
            throw APIError.noContent
        }

        // Parse inner JSON string that Claude produced
        guard let innerData = textBlock.text.data(using: .utf8) else {
            throw APIError.noContent
        }

        do {
            return try JSONDecoder().decode(ClaudeResponse.self, from: innerData)
        } catch {
            throw APIError.decodingFailed("inner: \(error.localizedDescription)\nRaw: \(textBlock.text)")
        }
    }

    // MARK: — Load API key from Config.plist (gitignored)
    private static func loadAPIKey() throws -> String {
        guard
            let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
            let dict = NSDictionary(contentsOfFile: path),
            let key  = dict["ANTHROPIC_API_KEY"] as? String,
            !key.isEmpty,
            key != "sk-ant-YOUR_KEY_HERE"
        else {
            throw APIError.missingAPIKey
        }
        return key
    }
}
