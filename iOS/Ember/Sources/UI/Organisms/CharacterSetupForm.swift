import SwiftUI
import PhotosUI

struct CharacterSetupForm: View {
    @ObservedObject var viewModel: CharacterSetupViewModel
    @State private var selectedPhoto: PhotosPickerItem? = nil

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                avatarSection
                basicInfoSection
                personalitySection
                additionalInfoSection
                aiProviderSection
                saveButton
            }
            .padding(20)
        }
        .onChange(of: selectedPhoto) { item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    viewModel.avatarImage = image
                }
            }
        }
    }

    private var avatarSection: some View {
        PhotosPicker(selection: $selectedPhoto, matching: .images) {
            ZStack {
                CTAvatar(name: viewModel.name.isEmpty ? "?" : viewModel.name,
                         size: 90, image: viewModel.avatarImage)
                Circle()
                    .stroke(Color.purple.opacity(0.3), lineWidth: 2)
                    .frame(width: 90, height: 90)
                Image(systemName: "camera.fill")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(6)
                    .background(Color.purple)
                    .clipShape(Circle())
                    .offset(x: 30, y: 30)
            }
        }
    }

    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("湲곕낯 ?뺣낫")
            labeledField("?대쫫 *", text: $viewModel.name, limit: 20, placeholder: "罹먮┃???대쫫")
            labeledField("愿怨?, text: $viewModel.relationship, limit: 50, placeholder: "?? ?곗씤, ?뚭퓠移쒓뎄")
        }
    }

    private var personalitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("?깃꺽 & 留먰닾")
            labeledEditor("?깃꺽 *", text: $viewModel.personality, limit: 200, placeholder: "?깃꺽???먯꽭???곸뼱二쇱꽭??(10???댁긽)")
            labeledEditor("留먰닾 *", text: $viewModel.speechStyle, limit: 200, placeholder: "留먰닾瑜??먯꽭???곸뼱二쇱꽭??(10???댁긽)")
        }
    }

    private var additionalInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("異붽? ?뺣낫 (?좏깮)")
            labeledEditor("諛곌꼍", text: $viewModel.background, limit: 200, placeholder: "罹먮┃?곗쓽 諛곌꼍 ?ㅽ넗由?)
            labeledField("醫뗭븘?섎뒗 寃?, text: $viewModel.likes, limit: 100, placeholder: "?? 而ㅽ뵾, ?곗콉")
            labeledField("?レ뼱?섎뒗 寃?, text: $viewModel.dislikes, limit: 100, placeholder: "?? ?쒕걚?ъ슫 怨?)
        }
    }

    private var aiProviderSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader("AI 紐⑤뜽")
            Picker("AI 紐⑤뜽", selection: $viewModel.apiProvider) {
                ForEach(APIProvider.allCases, id: \.self) { provider in
                    Text(provider.displayName).tag(provider)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var saveButton: some View {
        CTButton(title: "罹먮┃???앹꽦?섍린", style: .primary) {
            Task { await viewModel.save() }
        }
        .disabled(!viewModel.canSave || viewModel.isLoading)
        .opacity(viewModel.canSave ? 1 : 0.5)
    }

    private func sectionHeader(_ text: String) -> some View {
        Text(text)
            .font(.subheadline.bold())
            .foregroundColor(.secondary)
    }

    private func labeledField(_ label: String, text: Binding<String>, limit: Int, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundColor(.secondary)
            ZStack(alignment: .leading) {
                if text.wrappedValue.isEmpty {
                    Text(placeholder).foregroundColor(.secondary.opacity(0.6)).font(.body)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                }
                TextField("", text: Binding(
                    get: { text.wrappedValue },
                    set: { text.wrappedValue = String($0.prefix(limit)) }
                ))
                .padding(.horizontal, 12).padding(.vertical, 10)
            }
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            Text("\(text.wrappedValue.count)/\(limit)").font(.caption2).foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private func labeledEditor(_ label: String, text: Binding<String>, limit: Int, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundColor(.secondary)
            ZStack(alignment: .topLeading) {
                if text.wrappedValue.isEmpty {
                    Text(placeholder).foregroundColor(.secondary.opacity(0.6)).font(.body)
                        .padding(.horizontal, 8).padding(.vertical, 10)
                }
                TextEditor(text: Binding(
                    get: { text.wrappedValue },
                    set: { text.wrappedValue = String($0.prefix(limit)) }
                ))
                .frame(minHeight: 80)
                .padding(4)
            }
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            Text("\(text.wrappedValue.count)/\(limit)").font(.caption2).foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }
}