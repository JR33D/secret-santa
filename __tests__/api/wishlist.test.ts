import { GET, POST } from '@/app/api/wishlist/[personId]/route';
import { DELETE } from '@/app/api/wishlist/item/[id]/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

describe('Wishlist API Routes', () => {
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

  describe('GET /api/wishlist/[personId]', () => {
    it('returns wishlist items for a person', async () => {
      const mockItems = [
        {
          id: 1,
          item_name: 'Book',
          link: 'https://example.com/book',
          image_url: 'https://example.com/book.jpg',
        },
        {
          id: 2,
          item_name: 'Gadget',
          link: null,
          image_url: null,
        },
      ];
      mockDb.all.mockResolvedValue(mockItems);

      const req = {} as any;
      const response = await GET(req, { params: { personId: '5' } });
      const json = await response.json();

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM wishlist_items WHERE person_id = ?',
        ['5']
      );
      expect(json).toEqual(mockItems);
      expect(json).toHaveLength(2);
    });

    it('returns empty array when person has no items', async () => {
      mockDb.all.mockResolvedValue([]);

      const req = {} as any;
      const response = await GET(req, { params: { personId: '10' } });
      const json = await response.json();

      expect(json).toEqual([]);
    });

    it('handles database errors', async () => {
      mockDb.all.mockRejectedValue(new Error('DB Error'));

      const req = {} as any;

      await expect(GET(req, { params: { personId: '5' } })).rejects.toThrow('DB Error');
    });
  });

  describe('POST /api/wishlist/[personId]', () => {
    it('creates a new wishlist item with all fields', async () => {
      mockDb.run.mockResolvedValue({ lastID: 10 });

      const req = {
        json: jest.fn().mockResolvedValue({
          item_name: 'New Book',
          link: 'https://example.com/newbook',
          image_url: 'https://example.com/newbook.jpg',
        }),
      };

      const response = await POST(req as any, { params: { personId: '5' } });
      const json = await response.json();

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO wishlist_items (person_id, item_name, link, image_url) VALUES (?, ?, ?, ?)',
        ['5', 'New Book', 'https://example.com/newbook', 'https://example.com/newbook.jpg']
      );
      expect(json).toEqual({
        id: 10,
        item_name: 'New Book',
        link: 'https://example.com/newbook',
        image_url: 'https://example.com/newbook.jpg',
      });
    });

    it('creates item with null optional fields', async () => {
      mockDb.run.mockResolvedValue({ lastID: 11 });

      const req = {
        json: jest.fn().mockResolvedValue({
          item_name: 'Simple Item',
          link: null,
          image_url: null,
        }),
      };

      const response = await POST(req as any, { params: { personId: '5' } });
      const json = await response.json();

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.any(String),
        ['5', 'Simple Item', null, null]
      );
      expect(json.id).toBe(11);
      expect(json.item_name).toBe('Simple Item');
    });

    it('converts empty strings to null for optional fields', async () => {
      mockDb.run.mockResolvedValue({ lastID: 12 });

      const req = {
        json: jest.fn().mockResolvedValue({
          item_name: 'Item',
          link: '',
          image_url: '',
        }),
      };

      const response = await POST(req as any, { params: { personId: '5' } });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.any(String),
        ['5', 'Item', null, null]
      );
    });

    it('handles database errors', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const req = {
        json: jest.fn().mockResolvedValue({
          item_name: 'Test Item',
        }),
      };

      await expect(POST(req as any, { params: { personId: '5' } })).rejects.toThrow('DB Error');
    });
  });

  describe('DELETE /api/wishlist/item/[id]', () => {
    it('deletes a wishlist item successfully', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const req = {} as any;
      const response = await DELETE(req, { params: { id: '10' } });
      const json = await response.json();

      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM wishlist_items WHERE id = ?',
        ['10']
      );
      expect(json).toEqual({ success: true });
    });

    it('handles deletion of non-existent item', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const req = {} as any;
      const response = await DELETE(req, { params: { id: '999' } });
      const json = await response.json();

      expect(json).toEqual({ success: true });
    });

    it('handles database errors', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const req = {} as any;

      await expect(DELETE(req, { params: { id: '10' } })).rejects.toThrow('DB Error');
    });
  });
});