import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/signup', async (request, reply) => {
    const signUpRequestBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const { name, email } = signUpRequestBodySchema.parse(request.body)

    const userAlreadyExist = await knex('users').where({ email }).first()

    if (userAlreadyExist) {
      return reply.status(400).send({ message: 'User already exists' })
    }

    await knex('users')
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        session_id: sessionId,
      })
      .returning('*')

    reply.status(201).send()
  })

  app.get('/', async (request, reply) => {
    const users = await knex('users').select('*')
    return users
  })
}
