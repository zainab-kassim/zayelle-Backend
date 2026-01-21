import { Sequelize } from 'sequelize'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'


dotenv.config()  // this reads your .env


export const supabase = createClient(process.env.PROJECTURL!, process.env.APIKEY!)