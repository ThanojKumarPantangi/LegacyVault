import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient.js";

export const fetchNominees = createAsyncThunk(
  "nominees/fetchNominees",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/nominees");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addNominee = createAsyncThunk(
  "nominees/addNominee",
  async (nomineeData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/nominees", nomineeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNominee = createAsyncThunk(
  "nominees/updateNominee",
  async ({ nomineeId, nomineeData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/nominees/${nomineeId}`, nomineeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNominee = createAsyncThunk(
  "nominees/deleteNominee",
  async (nomineeId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/nominees/${nomineeId}`);
      return nomineeId;
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

const nomineeSlice = createSlice({
  name: "nominees",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNominees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNominees.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNominees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addNominee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNominee.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addNominee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateNominee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNominee.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(updateNominee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteNominee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNominee.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteNominee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default nomineeSlice.reducer;
