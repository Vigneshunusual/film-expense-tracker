import axios from "axios"  //We import Axios so React can communicate with our Django backend.

const api = axios.create({  //We create our own Axios object called api.
  baseURL: "http://localhost:8000/api",   //all API requests start with this URL.
  withCredentials: true,     //browser sends/receives 
  

  //access_token cookie means :WHO is making the request?
  //csrf token means : DID this request come from our trusted frontend?

  //csrf token: The browser also stores the csrftoken cookie, but Axios reads it and puts its value into the header for unsafe requests:
  xsrfCookieName: "csrftoken",   //tells Axios which cookie contains the CSRF token.
  xsrfHeaderName: "X-CSRFToken",   //tells Axios which header name to use when sending that token.
  withXSRFToken: true,  //Tell Axios to include the CSRF token in the request when making requests that require CSRF protection.
}) 


// ================================
// CSRF REQUEST INTERCEPTOR    => Before sending a request → get CSRF cookie → put it in X-CSRFToken header → send request.
// ================================

api.interceptors.request.use((config) => {  //Runs before every Axios request.

  const csrfToken = document.cookie  //Reads the browser's cookies.
    .split("; ")
    .find((row) => row.startsWith("csrftoken=")) //Finds the csrftoken cookie.
    ?.split("=")[1]  //Gets only the token value.

  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken  //Adds the token to the request header.
  }

  return config  //Allows Axios to continue sending the request.
})




// ================================
// RESPONSE INTERCEPTOR
// ================================

// The interceptor watches every API response, and when Django says 401, it automatically refreshes the access token and retries the failed request once.
//Response interceptor   : Runs after every API response.    
    //Successful response → return it normally.
    //Error response → check it.

api.interceptors.response.use((response) => {   //"Axios, whenever you receive a response from Django, check it here."
    return response    //If the response is successful, return it normally.
  },  

  async (error) => {   //If Django returns an error, this function runs.
    const originalRequest = error.config  //"Save the request that failed."We need it later because we want to try that same request again.

    if (error.response?.status === 401 &&   !originalRequest._retry && !originalRequest.url.includes("/auth/refresh/"))  
    //If the request failed with 401, it hasn't already been retried, and it isn't the refresh request itself, then try to refresh the access token.
       //i. Check whether it is a 401  , ?.means: If error.response exists, check its status. 
       //ii. Check _retry: this prevents infinite loops. If we already retried this request, don't retry it again. 
              //Initially, _retry is undefined. When we retry the request, we set _retry to true. So if we get another 401 for the same request, we won't retry it again.
       //ii. Suppose the refresh request itself fails(401):We don't want the interceptor to call /auth/refresh/ again.
    {
      originalRequest._retry = true //Mark the request as retried .which means "We are going to retry this request once."

      try {
        await api.post("/auth/refresh/")
        return api(originalRequest)    //Retry the original request with the new access token. The api object automatically includes the new access token in the  httpOnly cookies.
      } 
      
      catch (refreshError) 
      {
        window.location.href = "/login"   //This sends the user back to Login.
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api