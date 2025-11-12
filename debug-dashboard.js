// Debug script to check database tables
const { createClient } = require('@supabase/supabase-js')

// You'll need to add your Supabase credentials here
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDashboard() {
  console.log('🔍 Debugging Dashboard Data...')
  
  const today = new Date().toISOString().split('T')[0]
  console.log('📅 Today (YYYY-MM-DD):', today)
  
  try {
    // Check users table
    console.log('\n👥 Checking users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, created_at, status, role')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users error:', usersError)
    } else {
      console.log('✅ Recent users:', users)
      
      const newUsersToday = users?.filter(u => 
        u.created_at && u.created_at.startsWith(today)
      ).length || 0
      console.log('🆕 New users today:', newUsersToday)
    }
    
    // Check transactions table
    console.log('\n💳 Checking transactions table...')
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (transError) {
      console.error('❌ Transactions error:', transError)
    } else {
      console.log('✅ Recent transactions:', transactions)
      
      const transactionsToday = transactions?.filter(t => 
        t.created_at && t.created_at.startsWith(today)
      ).length || 0
      console.log('📈 Transactions today:', transactionsToday)
    }
    
    // Check pix_transactions table
    console.log('\n📱 Checking pix_transactions table...')
    const { data: pixTransactions, error: pixError } = await supabase
      .from('pix_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (pixError) {
      console.error('❌ PIX transactions error:', pixError)
    } else {
      console.log('✅ Recent PIX transactions:', pixTransactions)
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugDashboard()
