
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

async function callReset() {
    console.log('Calling check-trades?action=reset ...')
    try {
        const res = await fetch(`${url}/functions/v1/check-trades?action=reset`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        })
        const data = await res.json()
        console.log('Response:', JSON.stringify(data, null, 2))
    } catch (err) {
        console.error('Error:', err.message)
    }
}

callReset()
