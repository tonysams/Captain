import Foundation

// MARK: — The JSON shape Claude returns inside the API envelope
struct ClaudeResponse: Decodable, Equatable {
    let before: String   // Dense original excerpt (or context acknowledgment)
    let after: String    // Plain-language explanation with **bold** markers
    let chips: [String]  // 4 follow-up question strings
}

// MARK: — Outer Anthropic API envelope
struct AnthropicAPIResponse: Decodable {
    struct ContentBlock: Decodable {
        let type: String
        let text: String
    }
    let content: [ContentBlock]
}
