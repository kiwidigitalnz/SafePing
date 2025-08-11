import { useState } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ProcessingResult {
  success: boolean
  processed_at: string
  schedules_processed: number
  overdue_checkins: number
  overdue_details: Array<{
    userId: string
    userName: string
    scheduleId: string
    scheduleName: string
    organizationId: string
    overdueBy: number
    gracePeriodExpired: boolean
  }>
  error?: string
}

export function OverdueProcessor() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerProcessing = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase.functions.invoke('process-overdue-checkins', {
        body: {
          triggered_by: 'manual',
          triggered_at: new Date().toISOString()
        }
      })

      if (functionError) {
        throw functionError
      }

      setLastResult(data as ProcessingResult)
    } catch (err) {
      console.error('Error processing overdue check-ins:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Overdue Check-in Processing</h3>
          <p className="text-sm text-gray-600">
            Manually trigger the automated overdue check-in detection and escalation system
          </p>
        </div>
        
        <button
          onClick={triggerProcessing}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Processing...' : 'Process Now'}
        </button>
      </div>

      {/* Processing Status */}
      {loading && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-2" />
            <span className="text-blue-800 font-medium">Processing overdue check-ins...</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            This may take a few moments depending on the number of active schedules and workers.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Processing Failed</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Last Result */}
      {lastResult && (
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${
            lastResult.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center mb-3">
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Processing Completed' : 'Processing Failed'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Processed At:</span>
                <p className="font-medium">{formatTime(lastResult.processed_at)}</p>
              </div>
              <div>
                <span className="text-gray-600">Schedules Checked:</span>
                <p className="font-medium">{lastResult.schedules_processed}</p>
              </div>
              <div>
                <span className="text-gray-600">Overdue Found:</span>
                <p className="font-medium">{lastResult.overdue_checkins}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className={`font-medium ${
                  lastResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastResult.success ? 'Success' : 'Failed'}
                </p>
              </div>
            </div>

            {lastResult.error && (
              <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                <p className="text-red-800 text-sm font-medium">Error Details:</p>
                <p className="text-red-700 text-sm">{lastResult.error}</p>
              </div>
            )}
          </div>

          {/* Overdue Details */}
          {lastResult.overdue_details && lastResult.overdue_details.length > 0 && (
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Overdue Workers ({lastResult.overdue_details.length})
              </h4>
              
              <div className="space-y-3">
                {lastResult.overdue_details.map((detail, index) => (
                  <div key={index} className="bg-white rounded border border-orange-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-900">{detail.userName}</span>
                        <span className="text-sm text-orange-700">({detail.scheduleName})</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-orange-700">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{detail.overdueBy} min overdue</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          detail.gracePeriodExpired 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {detail.gracePeriodExpired ? 'Grace Period Expired' : 'Within Grace Period'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Overdue Workers */}
          {lastResult.success && lastResult.overdue_checkins === 0 && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">All workers are up to date!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                No overdue check-ins found. All scheduled workers have checked in on time.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">About Automated Processing</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• This function runs automatically every 5 minutes in production</li>
          <li>• It checks all active schedules and identifies overdue workers</li>
          <li>• Escalations are triggered when grace periods expire</li>
          <li>• Use this manual trigger for testing or immediate processing</li>
        </ul>
      </div>
    </div>
  )
}