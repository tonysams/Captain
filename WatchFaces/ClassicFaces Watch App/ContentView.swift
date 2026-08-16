import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            MarinerFace()
            AviatorFace()
            DressClassicFace()
            RegattaFace()
            FieldFace()
        }
        .tabViewStyle(.page)
        .ignoresSafeArea()
    }
}

#Preview {
    ContentView()
}
