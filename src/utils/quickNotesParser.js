// Utility functions for parsing and exporting Healthie quick_notes data

/**
 * Convert snake_case text to readable format by replacing underscores with spaces
 * @param {string} text - Snake case text
 * @returns {string} - Text with underscores replaced by spaces
 */
export const formatSnakeCase = (text) => {
  if (!text || typeof text !== 'string') return text
  return text.replace(/_/g, ' ')
}

/**
 * Parse HTML quick_notes content and extract structured data
 * @param {string} quickNotesHtml - The HTML content from quick_notes field
 * @returns {Object} - Parsed data object
 */
export const parseQuickNotes = (quickNotesHtml) => {
  if (!quickNotesHtml) return {}

  try {
    // Replace <br> tags with newlines to separate fields
    let textContent = quickNotesHtml.replace(/<br\s*\/?>/gi, '\n')
    
    // Remove all other HTML tags
    textContent = textContent.replace(/<[^>]*>/g, '')
    
    // Decode HTML entities
    textContent = textContent
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
    
    // Split by newlines and filter out empty lines
    const lines = textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    const parsedData = {}
    
    lines.forEach(line => {
      // Look for field_name: value pattern
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const fieldName = line.substring(0, colonIndex).trim()
        let value = line.substring(colonIndex + 1).trim()
  
         // Check if value starts with a bracket (indicates array)
         if (value.startsWith('[') && value.endsWith(']')) {
           // Remove brackets and get content
           const arrayContent = value.slice(1, -1).trim()
           if (arrayContent) {
             // For most fields, items are separated by spaces
                         // But for some fields with multi-word values, we need smarter parsing
            if (fieldName === 'family_history' || fieldName === 'medical_conditions' || fieldName === 'health_conditions') {
              // For medical/family history, try to split by common delimiters first
              if (arrayContent.includes(',')) {
                parsedData[fieldName] = arrayContent.split(',').map(item => item.trim()).filter(item => item.length > 0)
              } else if (arrayContent.includes(' and ')) {
                // Handle "diabetes mellitus and high blood pressure" case
                parsedData[fieldName] = arrayContent.split(' and ').map(item => item.trim()).filter(item => item.length > 0)
              } else {
                // Check if it looks like multiple conditions separated by spaces
                // Common pattern: "diabetes hypertension" or "diabetes_mellitus high_blood_pressure"
                const words = arrayContent.split(/\s+/)
                if (words.length > 1 && fieldName === 'family_history') {
                  // Try to group medical terms intelligently
                  const conditions = []
                  let currentCondition = []
                  
                  for (const word of words) {
                    // If word starts with capital letter, it might be a new condition
                    if (word[0] && word[0] === word[0].toUpperCase() && currentCondition.length > 0) {
                      conditions.push(currentCondition.join(' '))
                      currentCondition = [word]
                    } else {
                      currentCondition.push(word)
                    }
                  }
                  
                  // Add the last condition
                  if (currentCondition.length > 0) {
                    conditions.push(currentCondition.join(' '))
                  }
                  
                  parsedData[fieldName] = conditions.length > 1 ? conditions : [arrayContent]
                } else {
                  // Fallback to single item
                  parsedData[fieldName] = [arrayContent]
                }
              }
            } else {
               // For other fields, split by space (existing behavior)
               parsedData[fieldName] = arrayContent.split(/\s+/).filter(item => item.length > 0)
             }
           } else {
             parsedData[fieldName] = []
           }
         } else {
           // Convert "None" to null, otherwise store as string
           if (value === 'None') {
             parsedData[fieldName] = null
           } else {
             parsedData[fieldName] = value
           }
         }
      }
    })
    
    return parsedData
  } catch (error) {
    console.error('Error parsing quick notes:', error)
    return {}
  }
}

/**
 * Format parsed quick notes data with human-readable labels
 * @param {Object} parsedData - Parsed quick notes data
 * @returns {Object} - Formatted data with readable labels
 */
export const formatQuickNotesData = (parsedData) => {
  if (!parsedData || typeof parsedData !== 'object') return {}

  const formatters = {
    // Complex meal times
    'morning_7_10_am': 'Morning (7-10am)',
    'midday_11_am_2_pm': 'Midday (11am-2pm)',
    'evening_5_8_pm': 'Evening (5-8pm)',
    'morning_6_10_am': 'Morning (6-10am)',
    'late_night_9pm_later': 'Late Night (9pm+)',
    'late_night_after_8_pm': 'Late Night (After 8pm)',
    
    // Typical foods with better descriptions
    breakfast_other: 'Other Breakfast Foods',
    lunch_other: 'Other Lunch Foods',
    drinks_other: 'Other Drinks',
    rice_dishes: 'Rice Dishes',
    
  }

  const formatted = {}
  
  Object.keys(parsedData).forEach(key => {
    const value = parsedData[key]
    
    if (Array.isArray(value)) {
      // Format each item in the array
      formatted[key] = value.map(item => formatters[item] || item)
    } else if (typeof value === 'string') {
      // Format single values
      formatted[key] = formatters[value] || value
    } else {
      formatted[key] = value
    }
  })
  
  return formatted
}
