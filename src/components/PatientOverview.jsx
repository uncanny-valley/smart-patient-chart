import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_PATIENT_OVERVIEW, GET_USER_QUICK_NOTES, GET_PATIENT_APPOINTMENTS } from '../queries/healthieQueries'
import { parseQuickNotes, formatQuickNotesData, formatSnakeCase } from '../utils/quickNotesParser'

  const PatientOverview = ({ patientId, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview')
    
    // Helper function to display formatted or snake_case converted values
    const displayValue = (formatted, raw) => {
      if (formatted && formatted !== raw) return formatted
      if (Array.isArray(raw)) {
        return raw.map(item => formatSnakeCase(item)).join(', ')
      }
      return formatSnakeCase(raw)
    }
    
    // Helper function to format individual array items, prioritizing formatted versions
    const formatArrayItem = (item, formattedLookup) => {
      // If we have a formatted lookup object, try to find this item
      if (formattedLookup && typeof formattedLookup === 'object' && !Array.isArray(formattedLookup)) {
        const formattedValue = formattedLookup[item]
        if (formattedValue && formattedValue !== item) return formattedValue
      }
      // Fall back to snake_case formatting
      return formatSnakeCase(item)
    }

  const { loading: overviewLoading, error: overviewError, data: overviewData } = useQuery(GET_PATIENT_OVERVIEW, {
    variables: { userId: patientId },
    skip: !patientId
  })

  const { loading: quickNotesLoading, error: quickNotesError, data: quickNotesData } = useQuery(GET_USER_QUICK_NOTES, {
    variables: { userId: patientId },
    skip: !patientId
  })

  const { loading: appointmentsLoading, error: appointmentsError, data: appointmentsData } = useQuery(GET_PATIENT_APPOINTMENTS, {
    variables: { userId: patientId },
    skip: !patientId
  })

  if (!patientId) return null
  const patient = overviewData?.user

  // Parse quick notes data once for use across all tabs
  const parsedQuickNotes = quickNotesData?.user?.quick_notes ? parseQuickNotes(quickNotesData.user.quick_notes) : {}
  const formattedQuickNotes = formatQuickNotesData(parsedQuickNotes)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'medical', label: 'Medical Background', icon: '🏥' },
    { id: 'food', label: 'Nutrition', icon: '🍎' },
    { id: 'appointments', label: 'Appointments', icon: '📅' }
  ]

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' }
    const dateObj = new Date(dateString)
    return {
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const renderOverview = () => {
    if (overviewLoading) return <LoadingSpinner />
    if (overviewError) return <ErrorMessage error={overviewError} />
    if (!overviewData?.user) return <div>No patient data found</div>

    const user = overviewData.user
    
    return (
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {user.first_name} {user.last_name}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>📧 {user.email}</div>
            <div>📞 {user.phone_number}</div>
            <div>🎂 DOB: {formatDate(user.dob)}</div>
            <div>⚧ {user.gender}</div>
          </div>
        </div>

        {/* Patient Profile Information from Quick Notes */}
        {Object.keys(parsedQuickNotes).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Patient Profile Summary
            </h4>
            <div className="space-y-3 text-sm">
              {parsedQuickNotes.household && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Household: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.household, parsedQuickNotes.household)}</span>
                </div>
              )}
              {parsedQuickNotes.patient_motivation && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Motivation Level: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.patient_motivation, parsedQuickNotes.patient_motivation)}</span>
                </div>
              )}
              {parsedQuickNotes.eating_motivation && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Eating Motivation: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.eating_motivation, parsedQuickNotes.eating_motivation)}</span>
                </div>
              )}
              {parsedQuickNotes.pace_of_change && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Preferred Pace of Change: </span>
                  <span className="text-gray-600 dark:text-gray-400">{formattedQuickNotes.pace_of_change || parsedQuickNotes.pace_of_change}</span>
                </div>
              )}
              {parsedQuickNotes.support_areas && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Support Areas Needed: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                                        {Array.isArray(parsedQuickNotes.support_areas)
                      ? parsedQuickNotes.support_areas.map(area => formatArrayItem(area, formattedQuickNotes.support_areas)).join(', ')
                      : displayValue(formattedQuickNotes.support_areas, parsedQuickNotes.support_areas)
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMedicalBackground = () => {
    return (
      <div className="space-y-6">
        {/* Medical Information from Quick Notes */}
        {(parsedQuickNotes.food_allergies || parsedQuickNotes.food_sensitivities || parsedQuickNotes.personal_food_dealbreakers || parsedQuickNotes.household_food_dealbreakers || parsedQuickNotes.family_history || parsedQuickNotes.heart_condition) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Medical Information (Patient Reported)
            </h4>
            <div className="space-y-3 text-sm">
              {parsedQuickNotes.food_allergies && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Food Allergies: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.food_allergies)
                      ? parsedQuickNotes.food_allergies.join(', ')
                      : parsedQuickNotes.food_allergies
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.food_sensitivities && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Food Sensitivities: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.food_sensitivities)
                      ? parsedQuickNotes.food_sensitivities.join(', ')
                      : parsedQuickNotes.food_sensitivities
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.personal_food_dealbreakers && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Personal Food Dealbreakers: </span>
                  <span className="text-gray-600 dark:text-gray-400">{parsedQuickNotes.personal_food_dealbreakers}</span>
                </div>
              )}
              {parsedQuickNotes.household_food_dealbreakers && parsedQuickNotes.household_food_dealbreakers !== 'No' && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Household Food Dealbreakers: </span>
                  <span className="text-gray-600 dark:text-gray-400">{parsedQuickNotes.household_food_dealbreakers}</span>
                </div>
              )}
              {parsedQuickNotes.family_history && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Family History: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.family_history)
                      ? parsedQuickNotes.family_history.join(', ')
                      : parsedQuickNotes.family_history
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.heart_condition && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Heart Condition: </span>
                  <span className="text-gray-600 dark:text-gray-400">{parsedQuickNotes.heart_condition}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Allergies & Sensitivities */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Medical Allergies & Sensitivities
          </h4>
          {patient.allergy_sensitivities?.length > 0 ? (
            <div className="space-y-3">
              {user.allergy_sensitivities.map((allergy) => (
                <div key={allergy.id} className="border-l-4 border-red-200 dark:border-red-800 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-red-600 dark:text-red-400">
                        {allergy.allergy_type}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Severity: {allergy.severity}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(allergy.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-500">No medical allergies or sensitivities recorded</p>
          )}
        </div>

        {/* Patient Information Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Patient Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Full Name: </span>
              <span className="text-gray-600 dark:text-gray-400">{patient.first_name} {patient.last_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Date of Birth: </span>
              <span className="text-gray-600 dark:text-gray-400">{formatDate(patient.dob)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Gender: </span>
              <span className="text-gray-600 dark:text-gray-400">{patient.gender}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Email: </span>
              <span className="text-gray-600 dark:text-gray-400">{patient.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Patient Since: </span>
              <span className="text-gray-600 dark:text-gray-400">{formatDate(patient.created_at)}</span>
            </div>
          </div>
        </div>

        {/* No Additional Medical Data Message */}
        {Object.keys(parsedQuickNotes).length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">Limited Medical Information Available</h4>
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">
              This patient doesn't have detailed medical information in their profile beyond basic allergies. Additional medical data would be populated from patient intake forms, medical history, and clinical assessments.
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderFoodData = () => {

    return (
      <div className="space-y-6">
        {/* Dietary Preferences and Diet Restrictions */}
        {(parsedQuickNotes.diet_restrictions_preferences || parsedQuickNotes.cooking_experience || parsedQuickNotes.kitchen_tools || parsedQuickNotes.grocery_sentiment || parsedQuickNotes.meal_planning) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dietary Profile & Cooking Information
            </h4>
            <div className="space-y-3 text-sm">
              {parsedQuickNotes.diet_restrictions_preferences && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Diet Preferences: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                                        {Array.isArray(parsedQuickNotes.diet_restrictions_preferences)
                      ? parsedQuickNotes.diet_restrictions_preferences.map(diet => formatArrayItem(diet, formattedQuickNotes.diet_restrictions_preferences)).join(', ')
                      : displayValue(formattedQuickNotes.diet_restrictions_preferences, parsedQuickNotes.diet_restrictions_preferences)
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.cooking_experience && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cooking Experience: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.cooking_experience, parsedQuickNotes.cooking_experience)}</span>
                </div>
              )}
              {parsedQuickNotes.kitchen_tools && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Available Kitchen Tools: </span>
                  <span className="text-gray-600 dark:text-gray-400">{Array.isArray(parsedQuickNotes.kitchen_tools)
                      ? parsedQuickNotes.kitchen_tools.map(area => formatArrayItem(area, formattedQuickNotes.kitchen_tools)).join(', ')
                      : displayValue(formattedQuickNotes.kitchen_tools, parsedQuickNotes.kitchen_tools)}</span>
                </div>
              )}
              {parsedQuickNotes.grocery_sentiment && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Grocery Shopping Experience: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.grocery_sentiment, parsedQuickNotes.grocery_sentiment)}</span>
                </div>
              )}
              {parsedQuickNotes.meal_planning && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Meal Planning: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.meal_planning, parsedQuickNotes.meal_planning)}</span>
                </div>
              )}
              {parsedQuickNotes.meal_planning_other_input && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Meal Planning Details: </span>
                  <span className="text-gray-600 dark:text-gray-400 italic">"{parsedQuickNotes.meal_planning_other_input}"</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Food Preferences */}
        {(parsedQuickNotes.favorite_cuisines || parsedQuickNotes.favorite_condiments || parsedQuickNotes.taste_preferences) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Food Preferences
            </h4>
            <div className="space-y-3 text-sm">
              {parsedQuickNotes.favorite_cuisines && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Favorite Cuisines: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                                        {Array.isArray(parsedQuickNotes.favorite_cuisines)
                      ? parsedQuickNotes.favorite_cuisines.map(cuisine => formatArrayItem(cuisine, formattedQuickNotes.favorite_cuisines)).join(', ')
                      : displayValue(formattedQuickNotes.favorite_cuisines, parsedQuickNotes.favorite_cuisines)
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.favorite_condiments && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Favorite Condiments: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                                        {Array.isArray(parsedQuickNotes.favorite_condiments)
                      ? parsedQuickNotes.favorite_condiments.map(condiment => formatArrayItem(condiment, formattedQuickNotes.favorite_condiments)).join(', ')
                      : displayValue(formattedQuickNotes.favorite_condiments, parsedQuickNotes.favorite_condiments)
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.taste_preferences && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Taste Preferences: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.taste_preferences) 
                      ? parsedQuickNotes.taste_preferences.map(taste => formatArrayItem(taste, formattedQuickNotes.taste_preferences)).join(', ')
                      : displayValue(formattedQuickNotes.taste_preferences, parsedQuickNotes.taste_preferences)
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Typical Foods & Meal Patterns */}
        {(parsedQuickNotes.typical_breakfast || parsedQuickNotes.typical_lunch || parsedQuickNotes.typical_dinner || parsedQuickNotes.typical_snacks || parsedQuickNotes.typical_dessert || parsedQuickNotes.typical_drinks || parsedQuickNotes.meals_per_day || parsedQuickNotes.meal_times) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Typical Foods & Meal Patterns
            </h4>
            <div className="space-y-3 text-sm">
              {parsedQuickNotes.meals_per_day && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Meals Per Day: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.meals_per_day) 
                      ? parsedQuickNotes.meals_per_day.map((meal, idx) => formattedQuickNotes.meals_per_day?.[idx] || formatSnakeCase(meal)).join(', ')
                      : displayValue(formattedQuickNotes.meals_per_day, parsedQuickNotes.meals_per_day)
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.meal_times && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Preferred Meal Times: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.meal_times) 
                      ? parsedQuickNotes.meal_times.map((time, idx) => formattedQuickNotes.meal_times?.[idx] || formatSnakeCase(time)).join(', ')
                      : displayValue(formattedQuickNotes.meal_times, parsedQuickNotes.meal_times)
                    }
                  </span>
                </div>
              )}
              {parsedQuickNotes.dinner_at_home && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Dinner at Home Frequency: </span>
                  <span className="text-gray-600 dark:text-gray-400">{displayValue(formattedQuickNotes.dinner_at_home, parsedQuickNotes.dinner_at_home)}</span>
                </div>
              )}
              {parsedQuickNotes.typical_meal_locations && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Typical Meal Locations: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Array.isArray(parsedQuickNotes.typical_meal_locations) 
                      ? parsedQuickNotes.typical_meal_locations.map(location => formatArrayItem(location, formattedQuickNotes.typical_meal_locations)).join(', ')
                      : displayValue(formattedQuickNotes.typical_meal_locations, parsedQuickNotes.typical_meal_locations)
                    }
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Typical Foods:</div>
                {parsedQuickNotes.typical_breakfast && (
                  <div className="ml-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Breakfast: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                                          {Array.isArray(parsedQuickNotes.typical_breakfast)
                      ? parsedQuickNotes.typical_breakfast.map(item => formatArrayItem(item, formattedQuickNotes.typical_breakfast)).join(', ')
                      : displayValue(formattedQuickNotes.typical_breakfast, parsedQuickNotes.typical_breakfast)
                    }
                    </span>
                  </div>
                )}
                {parsedQuickNotes.other_breakfast_input && (
                  <div className="ml-4 text-gray-500 dark:text-gray-500 italic text-xs">
                    "{parsedQuickNotes.other_breakfast_input}"
                  </div>
                )}
                {parsedQuickNotes.typical_lunch && (
                  <div className="ml-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Lunch: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                                              {Array.isArray(parsedQuickNotes.typical_lunch) 
                          ? parsedQuickNotes.typical_lunch.map(item => formatArrayItem(item, formattedQuickNotes.typical_lunch)).join(', ')
                          : displayValue(formattedQuickNotes.typical_lunch, parsedQuickNotes.typical_lunch)
                        }
                    </span>
                  </div>
                )}
                {parsedQuickNotes.other_lunch_input && (
                  <div className="ml-4 text-gray-500 dark:text-gray-500 italic text-xs">
                    "{parsedQuickNotes.other_lunch_input}"
                  </div>
                )}
                {parsedQuickNotes.typical_dinner && (
                  <div className="ml-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dinner: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                                              {Array.isArray(parsedQuickNotes.typical_dinner) 
                          ? parsedQuickNotes.typical_dinner.map(item => formatArrayItem(item, formattedQuickNotes.typical_dinner)).join(', ')
                          : displayValue(formattedQuickNotes.typical_dinner, parsedQuickNotes.typical_dinner)
                        }
                    </span>
                  </div>
                )}
                {parsedQuickNotes.typical_snacks && (
                  <div className="ml-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Snacks: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                                              {Array.isArray(parsedQuickNotes.typical_snacks) 
                          ? parsedQuickNotes.typical_snacks.map(item => formatArrayItem(item, formattedQuickNotes.typical_snacks)).join(', ')
                          : displayValue(formattedQuickNotes.typical_snacks, parsedQuickNotes.typical_snacks)
                        }
                    </span>
                  </div>
                )}
                {parsedQuickNotes.typical_dessert && (
                  <div className="ml-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dessert: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                                              {Array.isArray(parsedQuickNotes.typical_dessert) 
                          ? parsedQuickNotes.typical_dessert.map(item => formatArrayItem(item, formattedQuickNotes.typical_dessert)).join(', ')
                          : displayValue(formattedQuickNotes.typical_dessert, parsedQuickNotes.typical_dessert)
                        }
                    </span>
                  </div>
                )}
                {parsedQuickNotes.typical_drinks && (
                  <div className="ml-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Drinks: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                                              {Array.isArray(parsedQuickNotes.typical_drinks) 
                          ? parsedQuickNotes.typical_drinks.map(item => formatArrayItem(item, formattedQuickNotes.typical_drinks)).join(', ')
                          : displayValue(formattedQuickNotes.typical_drinks, parsedQuickNotes.typical_drinks)
                        }
                    </span>
                  </div>
                )}
                {parsedQuickNotes.other_drinks && (
                  <div className="ml-4 text-gray-500 dark:text-gray-500 text-xs">
                    Other drinks: {parsedQuickNotes.other_drinks}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patient Profile Summary */}
        {Object.keys(parsedQuickNotes).length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">No Nutrition Profile Available</h4>
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">
              This patient doesn't have detailed nutrition information in their profile. Nutrition data would be populated from patient intake forms and assessments.
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderAppointments = () => {
    if (appointmentsLoading) return <LoadingSpinner />
    if (appointmentsError) return <ErrorMessage error={appointmentsError} />
    if (!appointmentsData?.user?.appointments) return <div>No appointments found</div>

    const appointments = appointmentsData.user.appointments

    return (
      <div className="space-y-6">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Date and Time */}
                  <div className="flex items-center space-x-4 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(() => {
                        const { date, time } = formatDateTime(appointment.date)
                        return (
                          <>
                            {date}
                            <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                              at {time}
                            </span>
                          </>
                        )
                      })()}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {/* Confirmed Status */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.confirmed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {appointment.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                      
                      {/* Attended Status */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.attendees?.length > 0
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {appointment.attendees?.length > 0 ? 'Attended' : 'Not Attended'}
                      </span>
                    </div>
                  </div>

                  {/* Provider Information */}
                  {appointment.provider && (
                    <div className="mb-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Provider: </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {appointment.provider.first_name} {appointment.provider.last_name}
                      </span>
                    </div>
                  )}

                  {/* Appointment Type */}
                  {appointment.appointment_type && (
                    <div className="mb-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Type: </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {appointment.appointment_type.name}
                        {appointment.appointment_type.length && (
                          <span className="text-gray-500 dark:text-gray-500 ml-1">
                            ({appointment.appointment_type.length} min)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {appointment.notes?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Notes:</h5>
                      <div className="space-y-2">
                        {appointment.notes.map((note) => (
                          <div key={note.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded border-l-4 border-blue-200 dark:border-blue-800">
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Answers */}
                  {appointment.form_answer_groups?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Forms Completed:</h5>
                      <div className="space-y-2">
                        {appointment.form_answer_groups.map((group) => (
                          <div key={group.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800 dark:text-gray-200">{group.name}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                group.finished 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}>
                                {group.finished ? 'Complete' : 'Incomplete'}
                              </span>
                            </div>
                            {group.answers?.length > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {group.answers.slice(0, 3).map((answer, idx) => (
                                  <div key={idx} className="mb-1">
                                    <span className="font-medium">{answer.label}:</span> {answer.answer}
                                  </div>
                                ))}
                                {group.answers.length > 3 && (
                                  <div className="text-gray-500 dark:text-gray-500 text-xs">
                                    +{group.answers.length - 3} more answers
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-500">No appointments found for this patient.</p>
          </div>
        )}
      </div>
    )
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
    </div>
  )

  const ErrorMessage = ({ error }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="text-red-800 dark:text-red-200 font-medium">Error loading data</div>
      <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error.message}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Patient Overview
            {patient && (
              <span className="text-lg font-normal text-gray-600 dark:text-gray-400 ml-2">
                - {patient.first_name} {patient.last_name}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'medical' && renderMedicalBackground()}
          {activeTab === 'food' && renderFoodData()}
          {activeTab === 'appointments' && renderAppointments()}
        </div>
      </div>
    </div>
  )
}

export default PatientOverview 