import Foundation

enum AppConfig {
    /// Base URL of the Node.js + Fastify backend API
    static var apiURL: String {
        Bundle.main.infoDictionary?["InstructorBuddyAPIURL"] as? String ?? "http://localhost:3000"
    }

    /// Supabase project URL
    static var supabaseURL: String {
        Bundle.main.infoDictionary?["SupabaseURL"] as? String ?? ""
    }

    /// Supabase anon (public) key
    static var supabaseAnonKey: String {
        Bundle.main.infoDictionary?["SupabaseAnonKey"] as? String ?? ""
    }

    /// Max frames to send for AI analysis per session
    static let maxFramesPerSession = 15

    /// Target JPEG size in KB before uploading to backend
    static let maxImageSizeKB = 200
}
