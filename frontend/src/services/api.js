import axios from "axios";

// Set up the base URL for the backend API
const API = axios.create({ baseURL: "https://localhost:5000/api" });

// Automatically attach token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication routes
export const login = (credentials) => API.post("/auth/login", credentials);
export const register = (userData) => API.post("/auth/register", userData);

// User routes
export const getUserProfile = (userId) => API.get(`users/${userId}`);

//issues
export const addIssue = (data) => API.post("/issues", data);

//issuedeatils
export const addComment = (issueId, commentText) =>
  API.post(`/issues/${issueId}/comments`, { text: commentText });
export const getIssueById = (id) => API.get(`/issues/${id}`);
export const upvoteIssue = (id) => API.post(`/issues/${id}/upvote`);
export const getAllIssues = () => API.get("/issues/all");

//chats 
export const getChatHistory = () => API.get("/chat-history");
export const getChatMessages = (senderId, receiverId) =>
  API.get(`/messages/${senderId}/${receiverId}`);

export const updateIssueStatus = (id, status) =>
  axios.patch(`api/admin/issues/${id}/status`, {
    status,
  });

export const updateprofilepic = (file) => {
  console.log("Updating profile picture with file:", file);
  const formData = new FormData();
  formData.append("profilePic", file);
  return API.post("/users/updateProfilePic", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateUserBio = (bio) => {
  return API.patch("/users/updateBio", { bio });
};


export default {
  login,
  register,
  getUserProfile,
  addIssue,
  addComment,
  getIssueById,
  upvoteIssue,
  getAllIssues,
  getChatHistory,
  getChatMessages
};
