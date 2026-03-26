# Research Based Suggestion for Form Creation in RoomFind.ie

Prepared by: Arinze

## Executive Summary

I reviewed the current RoomFind.ie listing creation flow against established UX guidance from GOV.UK, the CMS Design System, Nielsen Norman Group, Baymard Institute, and Google’s vacation-rental listing guidance. Overall, the flow already has a solid structure: it is broken into steps, clearly labels many fields as required vs optional, and includes helpful touches such as media previews and image optimization.

However, the main risk is not visual quality. The main risk is perceived effort. The current experience can feel longer and more mandatory than it really is. That creates hesitation, especially early in the flow, and can lead to abandonment before users reach the publishing step. At the same time, some fields that are worth keeping, such as the lister's role, need stronger downstream use so they feel justified to the user.

## Key Findings

- The flow is well structured, but it still feels longer than it needs to.
- Some fields appear to add friction without clear downstream value.
- Validation is too generic and creates unnecessary searching behavior.
- Optional sections are useful, but they currently feel too central to the publishing experience.
- Core listing-quality fields such as media, price, location, and availability should remain.

## Research Principles Used

### 1. Ask only what is necessary

GOV.UK recommends asking only for information that is genuinely needed and avoiding redundant questions. This matters because unnecessary fields increase perceived workload and can cause drop-off.

### 2. Reduce recall

Nielsen Norman Group recommends recognition over recall. In practice, this means users should be supported with examples, cues, and structured choices instead of having to invent answers from scratch too early.

### 3. Use clear validation

CMS and GOV.UK both recommend error summaries and field-level feedback instead of vague generic errors. This reduces frustration and shortens recovery time when users make mistakes or miss required information.

### 4. Minimize field burden

Baymard Institute consistently finds that reducing the burden of form fields improves usability and completion. Even optional fields affect perceived effort if they appear too prominent.

### 5. Preserve rich listing quality

Google’s listing guidance emphasizes strong listing data and strong media coverage. That means simplification should focus on removing unnecessary friction, not removing core listing content.

## Review of the Current Flow

The current listing flow is defined in `components/listings/CreateListingForm.jsx` and consists of 8 steps:

1. Basics
2. Property
3. Location
4. Media
5. Financials
6. Amenities
7. Preferences
8. Availability

### What the current flow does well

- It breaks the task into stages rather than presenting one long page.
- It labels many fields as required or optional.
- It has a visually strong media step with previews.
- It uses sensible defaults in a few places, which reduces later effort.

### Where the flow creates friction

- It asks for title and description early, before users have built momentum.
- Validation messages are broad and not tied closely enough to the exact field.
- Optional sections still feel like mandatory workload.
- There is no final review step before publishing.
- Some fields, such as lister role, appear important conceptually but are not surfaced clearly enough after submission.

## Recommendations

### 1. Keep the role question, but make it clearly useful

The `role` field in the Basics step should remain if the product intention is to show who is listing the property.

The UX issue is not the presence of the field itself. The UX issue is that users need to see why it matters. At the moment, that value is not clearly surfaced in the listing details experience. For example, the listing details page currently shows host information, but not the lister's stated role.

Recommendation: keep this field, but ensure it is persisted and displayed in relevant places such as the listing details page so users understand why they were asked for it.

### 2. Keep core listing-quality fields

I would not recommend removing the following:

- photos
- address/location
- monthly rent
- deposit
- availability date

These are core listing inputs and align with research-backed guidance around listing completeness, trust, and discoverability.

### 3. Replace generic validation with inline guidance

The current flow uses broad toast messages such as “Please fill in all basic details.” This is weaker than the guidance from CMS and GOV.UK, both of which recommend inline field-level errors and an error summary.

Recommendation: validation should identify exactly what is missing and where.

### 4. Reduce early writing burden

Title and description are important, but they are cognitively heavy inputs. Asking for them too early increases friction because users are forced to generate content before they have finished the factual setup of the listing.

Recommendation: keep these fields, but support them better with prompts, examples, templates, or move them later in the flow.

### 5. Reframe optional advanced steps

The Preferences step is useful, but it is optional and still feels like a major part of the publishing task.

Recommendation: keep these fields, but clearly position them as enhancements that improve matching quality rather than core requirements for publishing.

### 6. Add a review step before publish

A final review step would align with GOV.UK’s “Check answers” pattern and help users confirm that the listing looks complete and credible before it goes live.

### 7. Increase motivation around media

The current 1-photo minimum is reasonable for lowering friction, but users should be encouraged more strongly to add multiple photos.

Recommendation: communicate that while 1 photo may be enough to publish, listings with 5 to 8 or more photos are likely to perform better.

## What I Recommend Removing

- Remove unnecessary friction, not meaningful context. At this stage, I would not recommend removing the `role` field if the business intends to show who is listing the property.

## What I Recommend Keeping

- Photos requirement
- Location/address requirement
- Price and deposit requirement
- Availability date requirement
- Lister role, if it is surfaced meaningfully in the listing experience

## Priority Order

1. Keep the role field, but make it visible in the listing experience so it feels justified.
2. Improve validation with inline field-level errors.
3. Reduce early writing burden for title and description.
4. Add a final review step before publish.
5. Reframe optional advanced sections as enhancements.
6. Improve media guidance to encourage more complete listings.

## Sources

- GOV.UK Forms: https://www.forms.service.gov.uk/create-good-forms
- GOV.UK Design System, Check answers: https://design-system.service.gov.uk/patterns/check-answers/
- GOV.UK Service Manual, Designing good questions: https://www.gov.uk/service-manual/design/designing-good-questions
- CMS Design System, Error validation: https://design.cms.gov/patterns/Forms/error-validation/
- Nielsen Norman Group, Memory Recognition and Recall in User Interfaces: https://www.nngroup.com/articles/recognition-and-recall/
- Baymard Institute, Avoid Multi-Column Forms: https://baymard.com/blog/avoid-multi-column-forms
- Baymard Institute, Required and Optional Fields in Forms: https://baymard.com/blog/required-optional-form-fields
- Baymard Institute, Users Question Why You Need Seemingly Unnecessary Information: https://baymard.com/blog/checkout-experience-seemingly-unnecessary-information
- Baymard Institute, The Average Checkout Flow Has Too Many Form Fields: https://baymard.com/blog/checkout-flow-average-form-fields
- Google for Developers, Vacation Rentals: https://developers.google.com/hotels/vacation-rentals/dev-guide/onboarding

Prepared by Arinze.
