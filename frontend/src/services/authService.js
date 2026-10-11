
// //We installed Axios so React can communicate with our Django REST API.(React → Axios → Django API)
// import axios from "axios";

// //Store the API base URL
// //So instead of repeatedly writing the full URL, we store it in API_URL.
// const API_URL="http://localhost:8000/api/auth/";


// //data containss the form data which is submitted by the user. The register function sends a POST request to the Django API's /register/ endpoint with the form data. The response from the API is returned as a promise.
// //async means this function will perform an asynchronous operation — calling the Django API.
// const register = async(data) => {
//     //Axios sends: POST http://localhost:8000/api/auth//register/    and the second arg : data is the JSON payload sent to Django.
//     const response = await axios.post(`${API_URL}/register/`, data);
//     //contains the actual data returned by Django.
//     //For example, Django might return:
//     // {
//     //     "message": "Registration successful"
//     // }
//     // So we return that data back to the React component.
//     return response.data;
// }


// import axios from "axios"
// const API_URL = "http://localhost:8000/api/auth"

// export const registerUser = async (data) => {
//   const response = await axios.post(`${API_URL}/register/`,data)
//   return response.data
// }


// export const loginUser = async (data) => {
//   const response = await axios.post(`${API_URL}/login/`,data)
//   return response.data
// }


// export const refreshAccessToken = async (refresh) => {
//   const response = await axios.post(`${API_URL}/refresh/`, {refresh})
//   return response.data
// }



import api from "./api"

export const registerUser = async (data) => {
  const response = await api.post("/auth/register/", data)
  return response.data
}

export const loginUser = async (data) => {
  const response = await api.post("/auth/login/", data)
  return response.data
}

export const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh/")
  return response.data
}

export const logoutUser = async () => {
  const response = await api.post("/auth/logout/")
  return response.data
}


export const getCurrentOrganization = async () => {
  const response = await api.get("/auth/organization/")
  return response.data
}


export const getCurrentUser = async () => {
  const response = await api.get("/auth/me/")
  return response.data
}


export const getCSRFToken = async () => {
  const response = await api.get("/auth/csrf/")    // GET method only  creates/obtains the token; POST/PUT/PATCH/DELETE are the requests that need CSRF protection.
  return response.data
}



// Create an invitation for an organization member
export const createInvitation = async (invitationData) => {
  const response = await api.post("/auth/invitations/",invitationData)   //invitationData contains the information Nishok entered into the form.(invitationData is the request body sent to Django.)
  return response.data   //Returns the response body from Django, rather than the entire Axios response.
}



// Fetch invitation details using the token from the URL(This function allows React to call that endpoint using your existing Axios configuration.)
export const getInvitationDetails = async (token) => {   //identifies the specific invitation.
  const response = await api.get(`/auth/invitations/${token}/`)      //nserts the actual token into the URL.
  return response.data   //returns the invitation details to React.
}


// Accept an organization invitation (This function submits the user's form to accept the invitation.)
export const acceptInvitation = async (token, invitationData) => {   //token->tells Django which invitation to accept.and invitationData=< contains the fistname, lastname, password,forgot passeof
  const response = await api.post(`/auth/invitations/${token}/accept/`,invitationData)
  return response.data  //returns Django's success response to React.
}