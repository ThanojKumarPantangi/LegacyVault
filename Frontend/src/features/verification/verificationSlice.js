import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient.js";

// Async Thunks
export const fetchAvailableInheritances = createAsyncThunk(
  "verification/fetchAvailableInheritances",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/verification/available");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// submitNomineeAccessRequest has been deprecated as assets release is fully automated.

export const fetchReleasedAsset = createAsyncThunk(
  "verification/fetchReleasedAsset",
  async (assetId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/verification/released/${assetId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  inheritances: [],
  releasedAsset: null,
  loading: false,
  error: null,
};

const verificationSlice = createSlice({
  name: "verification",
  initialState,
  reducers: {
    clearReleasedAsset: (state) => {
      state.releasedAsset = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Available
      .addCase(fetchAvailableInheritances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableInheritances.fulfilled, (state, action) => {
        state.loading = false;
        state.inheritances = action.payload;
      })
      .addCase(fetchAvailableInheritances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // submitNomineeAccessRequest reducers have been removed.
      // Fetch Released Asset Details
      .addCase(fetchReleasedAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReleasedAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.releasedAsset = action.payload;
      })
      .addCase(fetchReleasedAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReleasedAsset } = verificationSlice.actions;
export default verificationSlice.reducer;
