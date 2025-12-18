
// TrackerU - Supabase-enabled App Logic
// Requires: <script src="https://unpkg.com/@supabase/supabase-js@2"></script> BEFORE this file

// 1) Put your real Supabase Project URL + anon key here (Project Settings -> API)
const SUPABASE_URL = "https://axrqkbdgcvsyoxlbuwoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnFrYmRnY3ZzeW94bGJ1d29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTU4MTcsImV4cCI6MjA4MTA3MTgxN30.kTP1WkLi9dkU5VB6egAF6IehYVURVV2inIju_2ckTHQ";

// Create Supabase client (this enables Auth + DB)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --------------------
// Data Management
// --------------------
const DataManager = {
  // Admin dashboard list (works only when logged in; RLS will restrict by admin_id)
  async fetchPlayers() {
    const { data, error } = await supabaseClient
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPlayerById(id) {
    const { data, error } = await supabaseClient
      .from("players")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  // ✅ Player/parent lookup by code (works for anon) via RPC
  async getPlayerByCode(code) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return null;

    const { data, error } = await supabaseClient
      .rpc("get_player_by_code", { code_input: normalized });

    if (error) {
      console.error("RPC get_player_by_code error:", error.message);
      return null;
    }

    // RETURNS TABLE -> array
    return Array.isArray(data) && data.length ? data[0] : null;
  },

  // Admin creates player: must include admin_id = auth.uid() to satisfy RLS
  async addPlayer(playerData) {
    const user = await Auth.getUser();
    if (!user) throw new Error("Not logged in.");

    const payload = {
      ...playerData,
      code: (playerData.code || this.generateSecretCode()).toUpperCase(),
      admin_id: user.id,
      assignedVideos: Array.isArray(playerData.assignedVideos) ? playerData.assignedVideos : [],
      metrics: playerData.metrics || {},
    };

    const { data, error } = await supabaseClient
      .from("players")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlayer(id, updates) {
    const { data, error } = await supabaseClient
      .from("players")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlayer(id) {
    const { error } = await supabaseClient
      .from("players")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async addVideo(playerId, video) {
    const player = await this.getPlayerById(playerId);
    if (!player) throw new Error("Player not found");

    const assignedVideos = Array.isArray(player.assignedVideos) ? player.assignedVideos : [];
    const newVideo = {
      id: crypto.randomUUID(),
      title: video.title || "Training Video",
      url: video.url,
      created_at: new Date().toISOString(),
    };

    assignedVideos.push(newVideo);
    return await this.updatePlayer(playerId, { assignedVideos });
  },

  async removeVideo(playerId, videoId) {
    const player = await this.getPlayerById(playerId);
    if (!player) throw new Error("Player not found");

    const assignedVideos = (player.assignedVideos || []).filter(v => v.id !== videoId);
    return await this.updatePlayer(playerId, { assignedVideos });
  },

  generateSecretCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
};

// --------------------
// Auth
// --------------------
const Auth = {
  async loginAdmin(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || "").trim(),
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  },

  async logoutAdmin() {
    await supabaseClient.auth.signOut();
  },

  async getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data?.user || null;
  },

  async requireAdmin() {
    const user = await this.getUser();
    if (!user) window.location.href = "admin-login.html";
  },

  // Player session (code-based)
  getCurrentPlayerCode() {
    return sessionStorage.getItem("currentPlayerCode");
  },
  setCurrentPlayerCode(code) {
    sessionStorage.setItem("currentPlayerCode", code);
  },
  clearCurrentPlayerCode() {
    sessionStorage.removeItem("currentPlayerCode");
  }
};

// --------------------
// UI helpers (keep minimal)
// --------------------
const UI = {
  formatDate(dateString) {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  }
};

// Expose globally for inline scripts
window.DataManager = DataManager;
window.Auth = Auth;
window.UI = UI;
window.supabaseClient = supabaseClient;
