import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import UserAPI from "../../api/UserAPI";

export const fetchUserInfo = createAsyncThunk(
  "user/fetchUserInfo",
  async () => {
    const response = await UserAPI.fetchUserInfo();
    return response;
  }
);

export const fetchUserStatus = createAsyncThunk(
  "user/fetchUserStatus",
  async () => {
    const response = await UserAPI.fetchUserStatus();
    return response;
  }
);

const initialState = {
  userData: null,
  isAdmin: false,
  isSuperAdmin: false,
  loaded: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.userData = null;
      state.isAdmin = false;
      state.isSuperAdmin = false;
      state.loaded = false;
    },
    updateUserField: (state, action) => {
      if (state.userData) {
        state.userData = { ...state.userData, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.loading = false;
        state.loaded = true;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(fetchUserStatus.fulfilled, (state, action) => {
        state.isAdmin = action.payload.isAdmin;
        state.isSuperAdmin = action.payload.isSuperAdmin;
      });
  },
});

export const { clearUser, updateUserField } = userSlice.actions;
export default userSlice.reducer;
