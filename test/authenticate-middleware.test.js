jest.mock("../utils/isAuthenticated");

const isAuthenticated = require("../utils/isAuthenticated");
const authenticate = require("../middleware/authenticate");

describe("authenticate middleware", () => {
  test("calls next() when the request is authenticated", () => {
    isAuthenticated.mockReturnValue(true);
    const next = jest.fn();
    const res = { redirect: jest.fn() };

    authenticate({}, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test("redirects to /login when the request is not authenticated", () => {
    isAuthenticated.mockReturnValue(false);
    const next = jest.fn();
    const res = { redirect: jest.fn() };

    authenticate({}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/login?errors=Please log in to get started.");
  });
});
