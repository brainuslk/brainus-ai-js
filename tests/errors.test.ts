import { describe, it, expect } from 'vitest'
import {
  BrainusError,
  AuthenticationError,
  RateLimitError,
  QuotaExceededError,
  APIError,
} from '../src/errors'

describe('Error classes', () => {
  describe('BrainusError', () => {
    it('is an instance of Error', () => {
      expect(new BrainusError('msg')).toBeInstanceOf(Error)
    })

    it('has correct name', () => {
      expect(new BrainusError('msg').name).toBe('BrainusError')
    })

    it('has correct message', () => {
      expect(new BrainusError('test message').message).toBe('test message')
    })
  })

  describe('AuthenticationError', () => {
    it('is an instance of BrainusError', () => {
      expect(new AuthenticationError()).toBeInstanceOf(BrainusError)
    })

    it('has correct name', () => {
      expect(new AuthenticationError().name).toBe('AuthenticationError')
    })

    it('has default message', () => {
      expect(new AuthenticationError().message).toBe('Invalid or missing API key')
    })

    it('accepts custom message', () => {
      expect(new AuthenticationError('custom').message).toBe('custom')
    })
  })

  describe('RateLimitError', () => {
    it('is an instance of BrainusError', () => {
      expect(new RateLimitError()).toBeInstanceOf(BrainusError)
    })

    it('has correct name', () => {
      expect(new RateLimitError().name).toBe('RateLimitError')
    })

    it('has default message', () => {
      expect(new RateLimitError().message).toBe('Rate limit exceeded')
    })

    it('retryAfter is undefined by default', () => {
      expect(new RateLimitError().retryAfter).toBeUndefined()
    })

    it('retryAfter is set when provided', () => {
      expect(new RateLimitError('msg', 30).retryAfter).toBe(30)
    })
  })

  describe('QuotaExceededError', () => {
    it('is an instance of BrainusError', () => {
      expect(new QuotaExceededError()).toBeInstanceOf(BrainusError)
    })

    it('has correct name', () => {
      expect(new QuotaExceededError().name).toBe('QuotaExceededError')
    })

    it('has default message', () => {
      expect(new QuotaExceededError().message).toBe('Monthly quota exceeded')
    })
  })

  describe('APIError', () => {
    it('is an instance of BrainusError', () => {
      expect(new APIError('msg')).toBeInstanceOf(BrainusError)
    })

    it('has correct name', () => {
      expect(new APIError('msg').name).toBe('APIError')
    })

    it('statusCode is undefined by default', () => {
      expect(new APIError('msg').statusCode).toBeUndefined()
    })

    it('statusCode is set when provided', () => {
      expect(new APIError('msg', 500).statusCode).toBe(500)
    })

    it('has correct message', () => {
      expect(new APIError('something went wrong').message).toBe('something went wrong')
    })
  })

  describe('instanceof checks across hierarchy', () => {
    it('AuthenticationError instanceof BrainusError and Error', () => {
      const e = new AuthenticationError()
      expect(e).toBeInstanceOf(BrainusError)
      expect(e).toBeInstanceOf(Error)
    })

    it('RateLimitError instanceof BrainusError and Error', () => {
      const e = new RateLimitError()
      expect(e).toBeInstanceOf(BrainusError)
      expect(e).toBeInstanceOf(Error)
    })

    it('QuotaExceededError instanceof BrainusError and Error', () => {
      const e = new QuotaExceededError()
      expect(e).toBeInstanceOf(BrainusError)
      expect(e).toBeInstanceOf(Error)
    })

    it('APIError instanceof BrainusError and Error', () => {
      const e = new APIError('msg')
      expect(e).toBeInstanceOf(BrainusError)
      expect(e).toBeInstanceOf(Error)
    })
  })
})
