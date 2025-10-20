import { GET, POST } from '@/app/api/restrictions/route';
import { DELETE } from '@/app/api/restrictions/[id]/routes';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

describe('Restrictions API Routes', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      all: jest.fn(),
      run: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/restrictions', () => {
    it('returns all restrictions with names', async () => {
      const mockRestrictions = [
        {
          id: 1,
          giver_id: 1,
          receiver_id: 2,
          giver_name: 'Alice',
          receiver_name: 'Bob',
        },
        {
          id: 2,
          giver_id: 2,
          receiver_id: 3,
          giver_name: 'Bob',
          receiver_name: 'Charlie',
        },
      ];
      mockDb.all.mockResolvedValue(mockRestrictions);

      const response = await GET();
      const json = await response.json();

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('JOIN people g ON r.giver_id = g.id')
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('JOIN people rec ON r.receiver_id = rec.id')
      );
      expect(json).toEqual(mockRestrictions);
      expect(json).toHaveLength(2);
    });

    it('returns empty array when no restrictions', async () => {
      mockDb.all.mockResolvedValue([]);

      const response = await GET();
      const json = await response.json();

      expect(json).toEqual([]);
    });

    it('handles database errors gracefully', async () => {
      mockDb.all.mockRejectedValue(new Error('DB Error'));

      // The current implementation doesn't have error handling
      // This would throw an error
      await expect(GET()).rejects.toThrow('DB Error');
    });
  });

  describe('POST /api/restrictions', () => {
    it('creates a new restriction successfully', async () => {
      mockDb.run.mockResolvedValue({ lastID: 5 });

      const req = {
        json: jest.fn().mockResolvedValue({
          giver_id: 1,
          receiver_id: 2,
        }),
      };

      const response = await POST(req as any);
      const json = await response.json();

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO restrictions (giver_id, receiver_id) VALUES (?, ?)',
        [1, 2]
      );
      expect(json).toEqual({
        id: 5,
        giver_id: 1,
        receiver_id: 2,
      });
    });

    it('handles database errors', async () => {
      mockDb.run.mockRejectedValue(new Error('UNIQUE constraint failed'));

      const req = {
        json: jest.fn().mockResolvedValue({
          giver_id: 1,
          receiver_id: 2,
        }),
      };

      // The current implementation doesn't have error handling
      await expect(POST(req as any)).rejects.toThrow();
    });

    it('handles duplicate restrictions', async () => {
      mockDb.run.mockRejectedValue(
        new Error('UNIQUE constraint failed: restrictions.giver_id, restrictions.receiver_id')
      );

      const req = {
        json: jest.fn().mockResolvedValue({
          giver_id: 1,
          receiver_id: 2,
        }),
      };

      await expect(POST(req as any)).rejects.toThrow('UNIQUE constraint');
    });
  });

  describe('DELETE /api/restrictions/[id]', () => {
    it('deletes a restriction successfully', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const req = {} as any;
      const response = await DELETE(req, { params: { id: '5' } });
      const json = await response.json();

      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM restrictions WHERE id = ?',
        ['5']
      );
      expect(json).toEqual({ success: true });
    });

    it('handles deletion of non-existent restriction', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const req = {} as any;
      const response = await DELETE(req, { params: { id: '999' } });
      const json = await response.json();

      expect(json).toEqual({ success: true });
    });

    it('handles database errors', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const req = {} as any;
      
      // The current implementation doesn't have error handling
      await expect(DELETE(req, { params: { id: '5' } })).rejects.toThrow('DB Error');
    });
  });
});