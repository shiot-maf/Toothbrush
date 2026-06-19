import SwiftUI

struct CTAvatar: View {
    let name: String
    var size: CGFloat = 50
    var image: UIImage? = nil

    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Circle()
                    .fill(LinearGradient(colors: [.purple.opacity(0.6), .pink.opacity(0.6)],
                                        startPoint: .topLeading, endPoint: .bottomTrailing))
                    .overlay(
                        Text(String(name.prefix(1)))
                            .font(.system(size: size * 0.4, weight: .bold))
                            .foregroundColor(.white)
                    )
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
}