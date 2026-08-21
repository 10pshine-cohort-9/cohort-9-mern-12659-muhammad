const { expect } = require('chai');
const sinon = require('sinon');
const Note = require('../../src/models/Note');
const noteController = require('../../src/controllers/noteController');

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

describe('noteController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { user: { id: 'user123' }, body: {}, params: {}, query: {} };
    res = createMockRes();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('rejects note creation without content', async () => {
    req.body = { title: 'Untitled' };
    await noteController.createNote(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.success).to.be.false;
  });

  it('creates note with title, rich text content, and category', async () => {
    req.body = { title: 'Plan', content: '<p>Content</p>', category: 'Work' };
    const mockNote = { _id: 'note123', ...req.body, userId: req.user.id };
    sinon.stub(Note, 'create').resolves(mockNote);

    await noteController.createNote(req, res);

    expect(res.statusCode).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.deep.equal(mockNote);
  });

  it('lists active notes by default', async () => {
    const mockNotes = [{ _id: 'n1', title: 'Note 1' }];
    sinon.stub(Note, 'find').returns({ sort: sinon.stub().resolves(mockNotes) });

    await noteController.getNotes(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.data).to.deep.equal(mockNotes);
  });

  it('filters notes by trash status and category', async () => {
    req.query = { isTrash: 'true', category: 'Work' };
    const mockNotes = [{ _id: 'n2', category: 'Work', isTrash: true }];
    const findStub = sinon.stub(Note, 'find').returns({ sort: sinon.stub().resolves(mockNotes) });

    await noteController.getNotes(req, res);

    expect(findStub.calledWith({ userId: 'user123', isTrash: true, category: 'Work' })).to.be.true;
    expect(res.statusCode).to.equal(200);
  });

  it('returns 404 if note not found by id', async () => {
    req.params.id = 'missing';
    sinon.stub(Note, 'findOne').resolves(null);

    await noteController.getNoteById(req, res);

    expect(res.statusCode).to.equal(404);
  });

  it('returns note by id', async () => {
    req.params.id = 'note123';
    const mockNote = { _id: 'note123', title: 'Note' };
    sinon.stub(Note, 'findOne').resolves(mockNote);

    await noteController.getNoteById(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.data).to.deep.equal(mockNote);
  });

  it('updates note fields', async () => {
    req.params.id = 'note123';
    req.body = { title: 'Updated', content: '<p>Updated</p>', category: 'Personal' };
    const mockNote = { title: 'Old', content: 'Old', category: 'Work', save: sinon.stub().resolves() };
    sinon.stub(Note, 'findOne').resolves(mockNote);

    await noteController.updateNote(req, res);

    expect(res.statusCode).to.equal(200);
    expect(mockNote.title).to.equal('Updated');
    expect(mockNote.content).to.equal('<p>Updated</p>');
    expect(mockNote.category).to.equal('Personal');
  });

  it('moves note to trash', async () => {
    req.params.id = 'note123';
    const mockNote = { isTrash: false, trashedAt: null, save: sinon.stub().resolves() };
    sinon.stub(Note, 'findOne').resolves(mockNote);

    await noteController.trashNote(req, res);

    expect(res.statusCode).to.equal(200);
    expect(mockNote.isTrash).to.be.true;
    expect(mockNote.trashedAt).to.be.instanceOf(Date);
  });

  it('restores note from trash', async () => {
    req.params.id = 'note123';
    const mockNote = { isTrash: true, trashedAt: new Date(), save: sinon.stub().resolves() };
    sinon.stub(Note, 'findOne').resolves(mockNote);

    await noteController.restoreNote(req, res);

    expect(res.statusCode).to.equal(200);
    expect(mockNote.isTrash).to.be.false;
    expect(mockNote.trashedAt).to.be.null;
  });

  it('permanently deletes note', async () => {
    req.params.id = 'note123';
    sinon.stub(Note, 'findOneAndDelete').resolves({ _id: 'note123' });

    await noteController.deleteNotePermanent(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
  });

  it('rejects empty notes array on import', async () => {
    req.body = [];
    await noteController.importNotes(req, res);

    expect(res.statusCode).to.equal(400);
  });

  it('imports valid notes in bulk', async () => {
    req.body = [{ title: 'Imported', content: '<p>Content</p>' }];
    const inserted = [{ _id: 'n1', title: 'Imported', content: '<p>Content</p>' }];
    sinon.stub(Note, 'insertMany').resolves(inserted);

    await noteController.importNotes(req, res);

    expect(res.statusCode).to.equal(201);
    expect(res.body.data).to.deep.equal(inserted);
  });
});
