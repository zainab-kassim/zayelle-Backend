import { Sequelize } from 'sequelize'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'


dotenv.config()  // this reads your .env

if (!process.env.PROJECTURL || !process.env.APIKEY) {
  throw new Error('Supabase env variables missing')
}

export const supabase = createClient(
  process.env.PROJECTURL,
  process.env.APIKEY
)


