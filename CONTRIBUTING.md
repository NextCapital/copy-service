# Contributing

Thank you for your interest in contributing to the Copy Service!

We appreciate your willingness to follow our guidelines. This lets everyone know you appreciate the time of developers responsible for building, maintaining, and managing this open source project. In return, they should reciprocate that respect by addressing your issue, assessing changes, and helping you finalize your pull requests.

We love new ideas and are welcoming an assortment of contributions, including anything from writing tutorials, improving documentation, submitting bug reports and feature requests or writing code that can be directly incorporated into the copy service. 

For new ideas, feature requests, and bugs, please use our GitHub issue tracker. For support questions, please contact us via [open-source@nextcapital.com](mailto:open-source@nextcapital.com) or by opening an issue with a “question” label.

## Security Disclosures 

**If you find a security vulnerability, DO NOT open an issue. Email [kreiserm@nextcapital.com](mailto:kreiserm@nextcapital.com) instead.** If you are at all uncertain about whether you are dealing with a security risk, please email us to be on the safe side. 

## Ground Rules 

- Ensure cross-platform compatibility for every change that is accepted: 
  - Windows, Mac, Ubuntu Linux, 
  - NodeJS 18+
  - Latest two major versions of Chrome, Firefox, Safari and Edge browsers, and Edge 18
- Create issues for any major changes and enhancements that you wish to make. 
  - Discuss things transparently and get community feedback.
- Keep feature versions as small as possible, preferably one new feature per version. 
- Be kind and courteous to all contributors. Please see our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Your Contributions

First time contributing to an open source project? Here are a couple of tutorials you might find helpful: [How to contribute to an open source project](https://makeapullrequest.com/) or check out this post for [first time only contributors.](https://www.firsttimersonly.com/) We recommend you start out with issues labeled as “good first issue”.

### Getting Started 

As you get started, please keep in mind we use a [Developer Certificate of Origin (DCO)](./DCO.md), so we’ll require you sign all of your commits. A DCO is meant to certify that you have created your contribution or are otherwise authorized to submit it to the project and agree that your contribution may be distributed under the project’s open source license. 

For all contributions, please follow these steps: 

1. Create your own fork of the code 
2. Create a branch in your fork for any changes you want to make 
3. If you like the changes and think it would be a helpful contribution, be sure to follow our code style (link to bottom section)
4. Include screenshots if they relevant to your issue 
5. Test your changes. Ensure 100% code coverage for unit tests and integration tests. 
6. We expect our ci task to be passing on CI, which includes lint, unit tests, integration tests, and build(s). If you have questions, the linter tells you what the rules are.
7. Sign your commits 

#### DCO Sign-Off Methods

The DCO requires a sign-off message in the following format appear on each commit in the pull request:

```
Signed-off-by: Mike Kreiser <kreiserm@nextcapital.com>
```

The DCO text can either be manually added to your commit body, or you can add either `-s` or `--signoff` to your usual git commit commands. If you are using the GitHub UI to make a change you can add the sign-off message directly to the commit message when creating the pull request. If you forget to add the sign-off you can also amend a previous commit with the sign-off by running `git commit --amend -s`. If you've pushed your changes to GitHub already you'll need to force push your branch after this with `git push -f.`

### Steps for reporting bugs 

You can follow this example of [how to file a bug report](https://gist.github.com/auremoser/72803ba969d0e61ff070).

1. It is important to include the steps to reproduce the issue, the expected result, the actual result, and any relevant screenshots. If you have ideas on how to fix the bug, please feel free to include them! 
2. In the “Context” portion of the bug report, you can include information like what OS and processor architecture you are using and a code sample or link to a repo where we can reproduce the issue. 

### How to Suggest a feature or enhancement

You can request an enhancement by submitting an issue (link this to issue tracker). When you open an issue, be sure to describe the feature you would like to see, why you need it, and how it should work.

## Code Review Process 

The core team looks at pull requests on a regular basis. After feedback is given, we expect responses within two weeks. After two weeks, we may close the pull request if it isn’t showing any activity. 

## Community

Author: @nc-piercej @nc-kreiserm @nc-foyollec @nc-choppk

Maintainers: @nc-piercej @nc-kreiserm

Contributors: 

## Code, commit message, and labeling conventions

### Preferred style for code: 

Please reference our [code style conventions.](https://github.com/BLC/nc-code-style-conventions/tree/master/javascript) We use Airbnb as a base, so most of those rules apply.

Eslint is used for checking code style. You can run `npm run lint` locally to verify. Some important mentions include: 

1. Use spaces for indentation, not tabs 
2. Use camelCase for all variables and file names
3. Avoid underscores as word separators

### Commit message conventions: 

While rebasing and merging both integrate changes from one branch to another, we prefer the rebase style. This moves the feature branch into main, rather than adding a new commit, simplifying the review process. 

#### Regularly add and commit your work to your branch

1. **Unstaged (i.e. un-added) work cannot be recovered if overwritten**

2. `git add -p`

3. `git commit -m "Concise but descriptive commit message" -s`

4. 1. [Writing a Good Commit Message](https://chris.beams.io/posts/git-commit/)

5. `git push`

#### Fixing up a commit

Per best practices, we should not have "Fix lint", "Add *PR* feedback", etc., commits. We can squash those changes into previous commits with meaningful messages.

1. `git commit -m "Commit to fixup"`
2. `git rebase -i HEAD~3 // Enters interactive mode`
3. `git rebase main`
4. `git push --force // Be careful before executing this`

See [Git Tools - Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History) for more on rebasing and using interactive mode.

### Labeling conventions for issues: 

1. bug report: when you find something that isn’t working properly
2. dependency: when you update a dependency file 
3. good first issue: good for newcomers
4. feature request: new feature or request
5. known issue: owner/maintainers are aware of the bug/issue, but there may not be a fix available. See thread.
6. won’t fix: this will not be worked on 
7. question: further information is requested 
8. logic review: seeking early design/structure review
9. wip: work in progress
10. wip-docs: writing docs
11. wip-tests: writing tests
