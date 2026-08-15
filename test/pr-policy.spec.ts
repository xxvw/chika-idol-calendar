import { describe, expect, it } from "vitest";
import {
  classifyPullRequest,
  findDuplicatePullRequests,
  runPolicy,
  validateStaticPolicy,
} from "../.github/scripts/pr-policy.mjs";

function pullRequest(overrides = {}) {
  return {
    number: 10,
    body: "Closes #1",
    base: {
      ref: "development",
      repo: { full_name: "xxvw/chika-idol-calendar" },
    },
    head: {
      ref: "feat/1-example",
      repo: { full_name: "xxvw/chika-idol-calendar" },
    },
    user: { login: "contributor" },
    labels: [],
    ...overrides,
  };
}

describe("PR policy", () => {
  it("Issue 参照なしを拒否する", () => {
    expect(() =>
      validateStaticPolicy(pullRequest({ body: "変更です" })),
    ).toThrow();
  });

  it("Closes #N 1件を受理する", () => {
    expect(validateStaticPolicy(pullRequest())).toEqual({
      kind: "ordinary",
      issueNumber: 1,
    });
  });

  it("複数 Issue 参照を拒否する", () => {
    expect(() =>
      validateStaticPolicy(pullRequest({ body: "Closes #1\nCloses #2" })),
    ).toThrow();
  });

  it("development から main への昇格 PR を受理する", () => {
    const promotion = pullRequest({
      body: "",
      base: { ref: "main", repo: { full_name: "xxvw/chika-idol-calendar" } },
      head: {
        ref: "development",
        repo: { full_name: "xxvw/chika-idol-calendar" },
      },
    });
    expect(classifyPullRequest(promotion)).toBe("promotion");
    expect(validateStaticPolicy(promotion)).toEqual({
      kind: "promotion",
      issueNumber: null,
    });
  });

  it("main への別ブランチを拒否する", () => {
    expect(() =>
      validateStaticPolicy(
        pullRequest({
          base: {
            ref: "main",
            repo: { full_name: "xxvw/chika-idol-calendar" },
          },
        }),
      ),
    ).toThrow();
  });

  it("Dependabot と security-exception を例外にする", () => {
    expect(
      validateStaticPolicy(
        pullRequest({ body: "", user: { login: "dependabot[bot]" } }),
      ),
    ).toEqual({ kind: "dependabot", issueNumber: null });
    expect(
      validateStaticPolicy(
        pullRequest({ body: "", labels: [{ name: "security-exception" }] }),
      ),
    ).toEqual({ kind: "security", issueNumber: null });
  });

  it("同じ Issue の別の通常 PR を検出する", () => {
    const current = pullRequest();
    const duplicate = pullRequest({ number: 11 });
    expect(findDuplicatePullRequests(current, [current, duplicate], 1)).toEqual(
      [duplicate],
    );
  });

  it("同一リポジトリの Open Issue を受理する", async () => {
    const notices: string[] = [];
    const github = {
      rest: {
        issues: { get: () => Promise.resolve({ data: { state: "open" } }) },
        pulls: { list: () => Promise.resolve({ data: [] }) },
      },
      paginate: () => Promise.resolve([]),
    };
    const context = {
      payload: { pull_request: pullRequest() },
      repo: { owner: "xxvw", repo: "chika-idol-calendar" },
    };

    await expect(
      runPolicy({
        github,
        context,
        core: { notice: (message: string) => notices.push(message) },
      }),
    ).resolves.toBeUndefined();
    expect(notices).toEqual(["Issue #1 と1対1で対応しています。"]);
  });

  it("Closed Issue を拒否する", async () => {
    const github = {
      rest: {
        issues: { get: () => Promise.resolve({ data: { state: "closed" } }) },
        pulls: { list: () => Promise.resolve({ data: [] }) },
      },
      paginate: () => Promise.resolve([]),
    };
    const context = {
      payload: { pull_request: pullRequest() },
      repo: { owner: "xxvw", repo: "chika-idol-calendar" },
    };

    await expect(
      runPolicy({ github, context, core: { notice: () => undefined } }),
    ).rejects.toThrow("Open Issue");
  });
});
