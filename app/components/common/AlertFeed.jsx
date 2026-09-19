'use client';

export default function AlertFeed({ alerts }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'pc-misuse':
        return '⚠️';
      case 'flight':
        return '✈️';
      case 'shipment':
        return '📦';
      case 'attendance':
        return '👤';
      case 'cctv':
        return '📹';
      default:
        return '🔔';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Alerts</h2>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recent alerts</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-lg ${getSeverityColor(alert.severity)} animate-slideIn`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {formatTime(alert.timestamp)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                  alert.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All Alerts →
        </button>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  return timestamp.toLocaleDateString();
}
