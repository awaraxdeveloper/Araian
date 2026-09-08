import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lsquukzinjjydncjzkgq.supabase.co";
const supabaseAnonKey = "sb_publishable_fYUf2F06Qqkmlap4NE5zyw_tlUZuRoz";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
