import { gql } from '@apollo/client'

// Get all patients with basic info
export const GET_ALL_PATIENTS = gql`
  query getAllPatients {
    users(active_status: "active") {
      id
      first_name
      last_name
      email
      phone_number
      dob
      gender
      height
      weight
      active
      created_at
      last_activity
    }
  }
`


export const GET_PATIENT_APPOINTMENTS = gql`
  query getPatientVisitNotes($userId: ID!) {
    user(id: $userId) {
      id
      first_name
      last_name
      
      # Recent appointments with notes
      appointments {
        id
        date
        confirmed
        provider {
          id
          first_name
          last_name
        }
        attendees {
          id
        }
        appointment_type {
          name
          length
        }
      }
    }
  }
`

// Combined query for patient overview
export const GET_PATIENT_OVERVIEW = gql`
  query getPatientOverview($userId: ID!) {
    user(id: $userId) {
      id
      first_name
      last_name
      email
      phone_number
      dob
      gender
      quick_notes
    }
  }
`

// Get user's quick notes (contains all the questionnaire data)
export const GET_USER_QUICK_NOTES = gql`
  query getUserQuickNotes($userId: ID!) {
    user(id: $userId) {
      id
      first_name
      last_name
      email
      quick_notes
    }
  }
`
