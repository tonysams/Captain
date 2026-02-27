import Foundation
import Network

// MARK: - OfflineJob

struct OfflineJob: Codable, Identifiable {
    let id: String
    let sessionId: String
    let request: UploadFrameRequest
    var retryCount: Int
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, sessionId, request, retryCount, createdAt
    }
}

// MARK: - OfflineQueueService
// Persists frame-upload jobs to UserDefaults.
// NWPathMonitor watches connectivity; on .satisfied drains the queue.

@MainActor
final class OfflineQueueService: ObservableObject {

    static let shared = OfflineQueueService()

    @Published var pendingCount: Int = 0

    private let storageKey = "offline_jobs_v1"
    private let maxRetries = 3
    private let monitor    = NWPathMonitor()
    private var isDraining = false

    private init() {
        pendingCount = loadJobs().count
        startMonitoring()
    }

    // MARK: - Enqueue

    func enqueue(sessionId: String, request: UploadFrameRequest) {
        var jobs = loadJobs()
        let job = OfflineJob(
            id:        UUID().uuidString,
            sessionId: sessionId,
            request:   request,
            retryCount: 0,
            createdAt: Date()
        )
        jobs.append(job)
        saveJobs(jobs)
        pendingCount = jobs.count
    }

    // MARK: - Drain

    func drainIfPossible() {
        Task { await drain() }
    }

    private func drain() async {
        guard !isDraining else { return }
        isDraining = true
        defer { isDraining = false }

        var jobs = loadJobs()
        guard !jobs.isEmpty else { return }

        var remaining: [OfflineJob] = []
        for var job in jobs {
            do {
                _ = try await APIService.shared.uploadFrame(job.request, sessionId: job.sessionId)
                // Job succeeded — drop it
            } catch {
                job.retryCount += 1
                if job.retryCount < maxRetries {
                    remaining.append(job)
                }
                // else: abandoned after maxRetries
            }
        }
        saveJobs(remaining)
        pendingCount = remaining.count
    }

    // MARK: - Persistence

    private func loadJobs() -> [OfflineJob] {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return [] }
        return (try? JSONDecoder().decode([OfflineJob].self, from: data)) ?? []
    }

    private func saveJobs(_ jobs: [OfflineJob]) {
        guard let data = try? JSONEncoder().encode(jobs) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }

    // MARK: - Network monitoring

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            if path.status == .satisfied {
                Task { await self?.drain() }
            }
        }
        monitor.start(queue: DispatchQueue.global(qos: .background))
    }
}
