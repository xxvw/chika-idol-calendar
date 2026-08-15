const closingReferencePattern =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;
const canonicalReferencePattern = /\bCloses\s+#(\d+)\b/g;

export function extractClosingIssueNumbers(body = "") {
  return [...body.matchAll(closingReferencePattern)].map((match) =>
    Number(match[1]),
  );
}

export function extractCanonicalIssueNumbers(body = "") {
  return [...body.matchAll(canonicalReferencePattern)].map((match) =>
    Number(match[1]),
  );
}

export function classifyPullRequest(pullRequest) {
  if (pullRequest.base.ref === "main") {
    return pullRequest.head.ref === "development" &&
      pullRequest.head.repo?.full_name === pullRequest.base.repo.full_name
      ? "promotion"
      : "invalid-main-source";
  }

  if (pullRequest.base.ref !== "development") return "invalid-base";
  if (pullRequest.user.login === "dependabot[bot]") return "dependabot";
  if (pullRequest.labels.some((label) => label.name === "security-exception")) {
    return "security";
  }
  return "ordinary";
}

export function validateStaticPolicy(pullRequest) {
  const kind = classifyPullRequest(pullRequest);
  if (kind === "invalid-main-source") {
    throw new Error(
      "main 向け PR は同一リポジトリの development ブランチからのみ作成できます。",
    );
  }
  if (kind === "invalid-base") {
    throw new Error("通常 PR の base は development にしてください。");
  }
  if (kind !== "ordinary") return { kind, issueNumber: null };

  const closingNumbers = extractClosingIssueNumbers(pullRequest.body ?? "");
  const canonicalNumbers = extractCanonicalIssueNumbers(pullRequest.body ?? "");
  if (closingNumbers.length !== 1 || canonicalNumbers.length !== 1) {
    throw new Error(
      "通常 PR の本文には `Closes #N` をちょうど1件だけ記載してください。",
    );
  }
  if (closingNumbers[0] !== canonicalNumbers[0]) {
    throw new Error(
      "Issue の close 参照は `Closes #N` の形式に統一してください。",
    );
  }

  return { kind, issueNumber: canonicalNumbers[0] };
}

export function findDuplicatePullRequests(
  pullRequest,
  openPullRequests,
  issueNumber,
) {
  return openPullRequests.filter((candidate) => {
    if (candidate.number === pullRequest.number) return false;
    if (classifyPullRequest(candidate) !== "ordinary") return false;
    return extractCanonicalIssueNumbers(candidate.body ?? "").includes(
      issueNumber,
    );
  });
}

export async function runPolicy({ github, context, core }) {
  const pullRequest = context.payload.pull_request;
  const result = validateStaticPolicy(pullRequest);
  if (result.kind !== "ordinary") {
    core.notice(`PR policy exception: ${result.kind}`);
    return;
  }

  const issue = await github.rest.issues.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: result.issueNumber,
  });
  if (issue.data.state !== "open" || issue.data.pull_request) {
    throw new Error(
      `#${result.issueNumber} は同一リポジトリの Open Issue ではありません。`,
    );
  }

  const pulls = await github.paginate(github.rest.pulls.list, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open",
    per_page: 100,
  });
  const duplicates = findDuplicatePullRequests(
    pullRequest,
    pulls,
    result.issueNumber,
  );
  if (duplicates.length > 0) {
    throw new Error(
      `#${result.issueNumber} を close する別の Open PR があります: ${duplicates
        .map((candidate) => `#${candidate.number}`)
        .join(", ")}`,
    );
  }

  core.notice(`Issue #${result.issueNumber} と1対1で対応しています。`);
}
