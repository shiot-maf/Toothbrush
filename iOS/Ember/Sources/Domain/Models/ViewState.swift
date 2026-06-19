import Foundation

enum ViewState<T> {
    case idle
    case loading
    case success(T)
    case failure(AppError)
}