import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient.js";

export const fetchPolicies = createAsyncThunk(
  "policies/fetchPolicies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/policies");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPolicy = createAsyncThunk(
  "policies/createPolicy",
  async (policyData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/policies", policyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePolicy = createAsyncThunk(
  "policies/updatePolicy",
  async ({ policyId, policyData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/policies/${policyId}`, policyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePolicy = createAsyncThunk(
  "policies/deletePolicy",
  async (policyId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/policies/${policyId}`);
      return policyId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const policySlice = createSlice({
  name: "policies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(updatePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      .addCase(deletePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default policySlice.reducer;
