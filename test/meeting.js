describe('Entities.Meeting', function() {
	describe('get() and set()', function() {
		it("returns the value set on the attr", function() {
			var meeting = new MeetingBooker.Entities.Meeting();
			meeting.set('foo', 'bar');
			expect(meeting.get('foo')).to.be('bar');
		})
	})
});

describe('Marionnete', function() {
	it("was loaded on the page", function() {
		expect(Marionette).not.to.be(undefined);
	});
});