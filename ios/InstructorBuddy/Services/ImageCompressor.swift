import UIKit
import CoreImage

// MARK: - ImageCompressor
// Compresses a CGImage to a JPEG base-64 string ≤ maxImageSizeKB.
// Mirrors the React Native useAnalysis.ts compression logic.

enum ImageCompressor {

    static let maxSizeBytes = AppConfig.maxImageSizeKB * 1024   // default 200 KB
    static let targetWidth:  CGFloat = 720

    /// Compress `image` to JPEG base-64.  Tries quality steps until under maxSize.
    static func compress(_ image: CGImage) -> String? {
        let uiImage = downscaled(image)
        let qualities: [CGFloat] = [0.85, 0.70, 0.55, 0.40, 0.25]
        for q in qualities {
            guard let data = uiImage.jpegData(compressionQuality: q),
                  !data.isEmpty else { continue }
            if data.count <= maxSizeBytes {
                return data.base64EncodedString()
            }
        }
        // Last resort: smallest quality
        return uiImage.jpegData(compressionQuality: 0.15)?.base64EncodedString()
    }

    // MARK: - Private

    private static func downscaled(_ cgImage: CGImage) -> UIImage {
        let srcW = CGFloat(cgImage.width)
        let srcH = CGFloat(cgImage.height)
        guard srcW > targetWidth else { return UIImage(cgImage: cgImage) }
        let scale  = targetWidth / srcW
        let newH   = srcH * scale
        let size   = CGSize(width: targetWidth, height: newH)

        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            UIImage(cgImage: cgImage).draw(in: CGRect(origin: .zero, size: size))
        }
    }
}
