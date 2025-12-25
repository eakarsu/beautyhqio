import SwiftUI

struct CustomTextField: View {
    let placeholder: String
    @Binding var text: String
    var icon: String? = nil
    var keyboardType: UIKeyboardType = .default
    var textContentType: UITextContentType? = nil
    var autocapitalization: TextInputAutocapitalization = .sentences

    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: 12) {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(isFocused ? .purple : .gray)
                    .frame(width: 20)
            }

            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .textContentType(textContentType)
                .textInputAutocapitalization(autocapitalization)
                .autocorrectionDisabled()
                .focused($isFocused)
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isFocused ? Color.purple : Color.clear, lineWidth: 2)
        )
    }
}

struct CustomSecureField: View {
    let placeholder: String
    @Binding var text: String
    var icon: String? = nil

    @State private var isSecure = true
    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: 12) {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(isFocused ? .purple : .gray)
                    .frame(width: 20)
            }

            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .textContentType(.password)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .focused($isFocused)

            Button {
                isSecure.toggle()
            } label: {
                Image(systemName: isSecure ? "eye.slash.fill" : "eye.fill")
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isFocused ? Color.purple : Color.clear, lineWidth: 2)
        )
    }
}

#Preview {
    VStack(spacing: 16) {
        CustomTextField(
            placeholder: "Email",
            text: .constant(""),
            icon: "envelope.fill"
        )
        CustomSecureField(
            placeholder: "Password",
            text: .constant(""),
            icon: "lock.fill"
        )
    }
    .padding()
}
