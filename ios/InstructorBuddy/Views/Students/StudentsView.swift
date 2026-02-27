import SwiftUI

struct StudentsView: View {

    @EnvironmentObject private var studentsVM: StudentsViewModel
    @EnvironmentObject private var sessionVM: SessionViewModel
    @State private var showAddSheet = false

    var body: some View {
        NavigationStack {
            Group {
                if studentsVM.isLoading {
                    ProgressView()
                        .tint(AppColors.primary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if studentsVM.students.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "person.2.slash")
                            .font(.system(size: 48))
                            .foregroundColor(AppColors.textMuted)
                        Text("No students yet")
                            .font(.title3)
                            .foregroundColor(AppColors.textMuted)
                        PrimaryButton(title: "Add Student", icon: "person.badge.plus") {
                            showAddSheet = true
                        }
                        .padding(.horizontal, 40)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(studentsVM.students) { student in
                                NavigationLink(destination:
                                    StudentDetailView(student: student)
                                        .environmentObject(studentsVM)
                                        .environmentObject(sessionVM)
                                ) {
                                    StudentCard(student: student)
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                        .padding(.vertical, 12)
                    }
                }
            }
            .background(AppColors.bg.ignoresSafeArea())
            .navigationTitle("Students")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddSheet = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                            .foregroundColor(AppColors.primary)
                    }
                }
            }
            .sheet(isPresented: $showAddSheet) {
                AddStudentSheet()
                    .environmentObject(studentsVM)
            }
            .onAppear {
                Task { await studentsVM.loadStudents() }
            }
        }
    }
}

// MARK: - AddStudentSheet

private struct AddStudentSheet: View {
    @EnvironmentObject private var studentsVM: StudentsViewModel
    @Environment(\.dismiss) var dismiss

    @State private var name       = ""
    @State private var email      = ""
    @State private var skillLevel = SkillLevel.intermediate
    @State private var notes      = ""
    @State private var isSaving   = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("Student name", text: $name)
                }
                Section("Email (optional)") {
                    TextField("student@example.com", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
                Section("Skill Level") {
                    Picker("Level", selection: $skillLevel) {
                        ForEach(SkillLevel.allCases, id: \.self) { level in
                            Text(level.label).tag(level)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                Section("Notes (optional)") {
                    TextField("Any relevant notes…", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                if let error {
                    Section {
                        Text(error)
                            .foregroundColor(AppColors.error)
                            .font(.footnote)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(AppColors.bg)
            .navigationTitle("Add Student")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
        }
    }

    private func save() {
        isSaving = true
        Task {
            do {
                try await studentsVM.createStudent(
                    name:       name.trimmingCharacters(in: .whitespaces),
                    email:      email.isEmpty ? nil : email,
                    skillLevel: skillLevel,
                    notes:      notes.isEmpty ? nil : notes
                )
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isSaving = false
        }
    }
}
