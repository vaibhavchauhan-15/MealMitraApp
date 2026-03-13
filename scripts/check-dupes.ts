import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.seed') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data, error } = await supabase
    .from('master_recipes')
    .select('title')
    .eq('source', 'app')

  if (error) { console.error(error.message); process.exit(1) }

  const titles = data!.map(r => r.title)
  const dupes = titles.filter((t, i) => titles.indexOf(t) !== i)

  if (dupes.length === 0) {
    console.log(`✅ No duplicates. Total records: ${titles.length}`)
  } else {
    console.log(`❌ ${dupes.length} duplicate(s) found:`, [...new Set(dupes)])
  }
}

check()
