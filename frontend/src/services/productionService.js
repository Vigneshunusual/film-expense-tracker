import api from "./api"

// Fetch all productions accessible to the logged-in user.
export const getProductions = async () => {
  const response = await api.get("/productions/")
  return response.data
}

// Fetch one production using its ID.
export const getProduction = async (productionId) => {
  const response = await api.get(`/productions/${productionId}/`)
  return response.data
}

// Create a new production.
export const createProduction = async (productionData) => {
  const response = await api.post("/productions/", productionData)
  return response.data
}

// Update an existing production.
export const updateProduction = async (productionId, productionData) => {
  const response = await api.patch(
    `/productions/${productionId}/`,
    productionData
  )
  return response.data
}

// Activate a planned production.
export const activateProduction = async (productionId) => {
  const response = await api.post(
    `/productions/${productionId}/activate/`
  )
  return response.data
}

// Complete an active production.
export const completeProduction = async (productionId) => {
  const response = await api.post(
    `/productions/${productionId}/complete/`
  )
  return response.data
}

// Archive a production.
export const archiveProduction = async (productionId) => {
  const response = await api.post(
    `/productions/${productionId}/archive/`
  )
  return response.data
}

// Restore an archived production.
export const restoreProduction = async (productionId) => {
  const response = await api.post(
    `/productions/${productionId}/restore/`
  )
  return response.data
}

// Assign an organization member to a production.
export const assignProductionMember = async (productionId, memberData) => {
  const response = await api.post(
    `/productions/${productionId}/members/`,
    memberData
  )
  return response.data
}