import ExpoModulesCore
import HealthKit

public class BeautyHQHealthModule: Module {
  private let store = HKHealthStore()
  public func definition() -> ModuleDefinition {
    Name("BeautyHQHealth")
    AsyncFunction("requestAuthorization") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(), let steps = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.reject("UNAVAILABLE", "HealthKit is unavailable on this device")
        return
      }
      self.store.requestAuthorization(toShare: [], read: [steps]) { success, error in
        if let error = error { promise.reject("AUTHORIZATION_FAILED", error.localizedDescription) }
        else { promise.resolve(success) }
      }
    }
    AsyncFunction("readSteps") { (days: Int, promise: Promise) in
      guard (1...30).contains(days), let type = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.reject("INVALID_RANGE", "Choose 1 to 30 days")
        return
      }
      let now = Date()
      let start = now.addingTimeInterval(-Double(days) * 86400)
      let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
      let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 5000, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, error in
        if let error = error { promise.reject("READ_FAILED", error.localizedDescription); return }
        let formatter = ISO8601DateFormatter()
        let rows = (samples as? [HKQuantitySample] ?? []).map { sample -> [String: Any] in
          ["externalId": sample.uuid.uuidString, "metric": "steps", "value": sample.quantity.doubleValue(for: .count()), "unit": "count", "measuredAt": formatter.string(from: sample.startDate)]
        }
        // Empty results may mean no data or read permission withheld. Do not infer authorization.
        promise.resolve(rows)
      }
      self.store.execute(query)
    }
  }
}
