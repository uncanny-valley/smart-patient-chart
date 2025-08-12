import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import DynamicTable from './components/DynamicTable'
import PatientOverview from './components/PatientOverview'
import { GET_ALL_PATIENTS } from './queries/healthieQueries'

function App() {
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  const { loading, error, data } = useQuery(GET_ALL_PATIENTS, {
    errorPolicy: 'all'
  })

  const enhancedTableData = (data?.users || []).map(patient => ({
    ...patient,
    actions: (
      <button
        onClick={() => setSelectedPatientId(patient.id)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        View Details
      </button>
    )
  }))

  const handleClosePatientOverview = () => {
    setSelectedPatientId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <main>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Patient Directory
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Click "View Details" to see medical background, nutrition data, and visit notes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {loading && (
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Loading...
                    </div>
                  )}
                  {error && (
                    <div className="text-red-600 dark:text-red-400 text-sm">
                      API Error: {error.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DynamicTable data={enhancedTableData} />
          </div>
        </main>
      </div>

      {selectedPatientId && (
        <PatientOverview
          patientId={selectedPatientId}
          onClose={handleClosePatientOverview}
        />
      )}
    </div>
  )
}

export default App 