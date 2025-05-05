import Foundation

enum Granularity {
  case fiveMinutes
  case oneHour
}

enum RoundMode {
  case up
  case down
}

func roundToGranularity(date: Date, granularity: Granularity, mode: RoundMode = .up) -> Date {
  let granularityMs: Int
  
  switch granularity {
  case .fiveMinutes:
    granularityMs = 5 * 60 * 1000
  case .oneHour:
    granularityMs = 60 * 60 * 1000
  }
  
  let timeMs = Int(date.timeIntervalSince1970 * 1000)
  let rounded = (timeMs / granularityMs) * granularityMs
  
  let resultMs = (mode == .up) ? rounded : (rounded - granularityMs)
  let resultTime = TimeInterval(resultMs) / 1000.0
  
  return Date(timeIntervalSince1970: resultTime)
}

func getAppUrl(project: ProjectListItem?) -> String {
  guard let project = project else {
    return "revcel://"
  }
  
  if let sharedDefaults = UserDefaults(suiteName: appGroupName) {
    let isSubscribed = sharedDefaults.bool(forKey: isSubscribedKey)
    
    if isSubscribed {
      return "revcel://projects/\(project.id)/(tabs)/home"
    }
  }

  return "revcel://?showPaywall=1"
}
