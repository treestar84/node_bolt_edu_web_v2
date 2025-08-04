import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase 클라이언트 초기화 (서비스 키 사용으로 RLS 우회)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY; // anon key 사용

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials missing. API key management will not work.');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseServiceKey);
  throw new Error('Supabase credentials are required for API key management');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API 키 해시 함수 (보안을 위해 실제 키 값을 해시해서 저장)
const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// 테이블 생성 (최초 실행시)
export const ensureApiKeysTable = async () => {
  try {
    // api_keys 테이블이 존재하는지 확인하고 없으면 생성
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'api_keys')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('📝 Checking for existing api_keys table...');
    }

    // 테이블이 없으면 SQL로 생성
    if (!tables || tables.length === 0) {
      console.log('🔧 Creating api_keys table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS api_keys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key_hash TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_used TIMESTAMP WITH TIME ZONE,
          usage_count INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
        CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.error('❌ Failed to create api_keys table:', createError);
        return false;
      }

      console.log('✅ api_keys table created successfully');
    } else {
      console.log('✅ api_keys table already exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Error ensuring api_keys table:', error);
    return false;
  }
};

// 모든 API 키 조회 (관리자용) - RLS 우회를 위해 rpc 사용
export const getApiKeys = async () => {
  try {
    // RLS를 우회하기 위해 직접 SQL 쿼리 사용
    const { data, error } = await supabase.rpc('get_api_keys_admin');

    if (error) {
      console.error('❌ Error fetching API keys:', error);
      // 대안: 직접 테이블 조회 시도
      const { data: directData, error: directError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (directError) {
        console.error('❌ Direct query also failed:', directError);
        return [];
      }
      
      return directData.map(key => ({
        id: key.id,
        name: key.name,
        description: key.description,
        active: key.active,
        createdAt: key.created_at,
        lastUsed: key.last_used,
        usageCount: key.usage_count,
        keyPreview: `${key.key_hash.substring(0, 8)}...${key.key_hash.substring(key.key_hash.length - 4)}`
      }));
    }

    // 보안을 위해 실제 키 값은 숨기고 미리보기만 제공
    return data.map(key => ({
      id: key.id,
      name: key.name,
      description: key.description,
      active: key.active,
      createdAt: key.created_at,
      lastUsed: key.last_used,
      usageCount: key.usage_count,
      keyPreview: `${key.key_hash.substring(0, 8)}...${key.key_hash.substring(key.key_hash.length - 4)}`
    }));
  } catch (error) {
    console.error('❌ Error in getApiKeys:', error);
    return [];
  }
};

// API 키 인증용 조회 (실제 키 값으로 검색)
export const getApiKeyForAuth = async (keyValue) => {
  try {
    if (!keyValue) return null;

    const keyHash = hashApiKey(keyValue);

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // 사용 통계 업데이트
    await supabase
      .from('api_keys')
      .update({
        last_used: new Date().toISOString(),
        usage_count: (data.usage_count || 0) + 1
      })
      .eq('id', data.id);

    console.log(`🔑 API key used: ${data.name} (${(data.usage_count || 0) + 1} times)`);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      active: data.active,
      createdAt: data.created_at,
      lastUsed: new Date().toISOString(),
      usageCount: (data.usage_count || 0) + 1
    };
  } catch (error) {
    console.error('❌ Error in getApiKeyForAuth:', error);
    return null;
  }
};

// 새 API 키 생성
export const addApiKey = async (keyData) => {
  try {
    await ensureApiKeysTable();

    // 새로운 API 키 생성
    const newApiKey = crypto.randomBytes(16).toString('hex');
    const keyHash = hashApiKey(newApiKey);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        key_hash: keyHash,
        name: keyData.name,
        description: keyData.description || '',
        active: true,
        created_at: new Date().toISOString(),
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating API key:', error);
      throw error;
    }

    console.log('✅ New API key created:', data.name);

    // 실제 키 값을 반환 (한 번만 보여줌)
    return {
      id: data.id,
      key: newApiKey, // 실제 키 값 (보안상 한 번만 반환)
      name: data.name,
      description: data.description,
      active: data.active,
      createdAt: data.created_at,
      lastUsed: data.last_used,
      usageCount: data.usage_count
    };
  } catch (error) {
    console.error('❌ Error in addApiKey:', error);
    throw error;
  }
};

// API 키 삭제
export const deleteApiKey = async (id) => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting API key:', error);
      return false;
    }

    console.log('🗑️ API key deleted:', id);
    return true;
  } catch (error) {
    console.error('❌ Error in deleteApiKey:', error);
    return false;
  }
};

// API 키 활성화/비활성화
export const toggleApiKey = async (id, active) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .update({ active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error toggling API key:', error);
      return null;
    }

    console.log(`🔄 API key ${active ? 'activated' : 'deactivated'}:`, data.name);
    return data;
  } catch (error) {
    console.error('❌ Error in toggleApiKey:', error);
    return null;
  }
};

// 기존 JSON 데이터를 DB로 마이그레이션
export const migrateFromJsonToDb = async (jsonApiKeys) => {
  try {
    console.log('🔄 Starting API keys migration from JSON to DB...');
    
    await ensureApiKeysTable();

    for (const key of jsonApiKeys) {
      // 이미 존재하는지 확인 (key_hash로)
      const keyHash = hashApiKey(key.key);
      
      const { data: existing } = await supabase
        .from('api_keys')
        .select('id')
        .eq('key_hash', keyHash)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase
          .from('api_keys')
          .insert({
            key_hash: keyHash,
            name: key.name,
            description: key.description || '',
            active: key.active,
            created_at: key.createdAt,
            last_used: key.lastUsed,
            usage_count: key.usageCount || 0
          });

        if (insertError) {
          console.error('❌ Error migrating API key:', key.name, insertError);
        } else {
          console.log('✅ Migrated API key:', key.name);
        }
      } else {
        console.log('⏭️ API key already exists:', key.name);
      }
    }

    console.log('🎉 API keys migration completed!');
    return true;
  } catch (error) {
    console.error('❌ Error in migration:', error);
    return false;
  }
};

export default {
  getApiKeys,
  getApiKeyForAuth,
  addApiKey,
  deleteApiKey,
  toggleApiKey,
  migrateFromJsonToDb,
  ensureApiKeysTable
};