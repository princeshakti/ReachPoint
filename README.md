# Halo Compass

build me a web app that lets users (in this case healthcare professionals like doctors, nurses, etc) input an address and it gives them a map of surrounding home shelters, food drives/pantry, ebt assistance, and things similar to this for people who need assistance. these people are patients that come in and need help so the doctor can give them a list of places near the address (for now maybe with a 2-3 mile radius). when the result come in the doctor/user should be able to click on them and get more info about the place and then easily place multiple locations in a list to print or give the the patient. add these features to the app: Where I think Halo can actually be different

Imagine a patient tells the nurse:

“I don't have enough food at home, and I don't have a car.”

Today's systems are very good at answering:

Food resources near ZIP 90650

But the useful answer isn't necessarily:

Food pantry — 2.1 miles away

Because 2.1 miles could mean:

5-minute drive

but

47-minute walk

And maybe the pantry closes in 25 minutes.

That's where I'd take Halo.

Halo should be proximity + feasibility

The search could begin:

Where does the patient live?

123 Main St, Norwalk, CA

What do they need?

Food

How can they travel?

○ Car ● Walking ○ Public transit

How far can they reasonably travel?

● 15 min ○ 30 min ○ 45 min

Instead of simply drawing a three-mile circle, Halo now draws a real accessibility halo.

That's much more interesting.

A three-mile circle assumes everyone has equal transportation.

They don't.

For a patient without a car, this:

3 miles

is actually less useful than:

≤ 20 minutes by bus

or

≤ 15 minutes walking

I did not find this type of transportation-mode-based community-resource ranking prominently documented in Findhelp, Unite Us, or One Degree.

That's the first gap I'd pursue.

Then create a Halo Match

Instead of displaying 47 food resources in a giant list:

Community Food Center

Halo Match: 96%

8 min away by bus

✓ Open today until 6 PM

✓ Walk-ins accepted

✓ Patient appears eligible

✓ Spanish available

✓ Currently accepting clients

✓ Free

✓ No ID required

What to bring:

Proof of address

Add to Patient Plan

Now you're combining information these other platforms often expose separately into a single question:

How realistic is this resource for this patient?

Findhelp already has sophisticated eligibility filters and availability functionality, so I wouldn't pretend those are new ideas. It allows programs to indicate capacity/waitlist status, for example.

The differentiation would be how Halo synthesizes the information.

Another feature I think could be genuinely useful: Halo Route

Suppose a patient needs:

Food

CalFresh enrollment help

Housing assistance

The nurse selects all three.

Instead of handing them:

Location A — 1.4 miles

Location B — 2.7 miles

Location C — 2.1 miles

Halo could say:

Your Resource Route

Home

↓ 8-minute bus

1. Community Food Pantry

9:00 AM–2:00 PM

↓ 4-minute walk

2. Benefits Enrollment Center

CalFresh application assistance

↓ 12-minute bus

3. Housing Resource Center

Then:

Total trip: approximately 1 hr 25 min

Open Route

Print Resource Plan

Text to Patient

I specifically searched the competitors for multi-resource routing/itinerary functionality and didn't find it documented as a core capability.

That is much more interesting than simply putting pins on a map.

Your patient handout could also be better than a normal directory printout

I wouldn't print ten pages of database information.

I'd design Halo around something a patient can actually take home:

Your Community Resources

Prepared for you by your care team

🍎 Food

Community Food Center

0.7 mi • 11-minute walk

Today: Open until 5 PM

You can walk in — appointment not required

Bring:

 Photo ID

 Proof of address

☎ Call: xxx-xxx-xxxx

📍 Directions QR code

💳 CalFresh

Benefits Enrollment Center

1.2 mi • Bus 460 — approximately 17 min

Today: Open until 6 PM

They can help you complete your application.

Bring:

 ID

 Income information if available

☎ xxx-xxx-xxxx

Last verified: Sep. 10, 2026

That feels much closer to something a nurse could hand someone and say:

“Start with these two.” The version of Halo I would build

My MVP would essentially have three screens.

1 — Patient location

Find resources around:

___

Then:

Needs

Food Housing Benefits Transportation Utilities Other

Travel

Walking Transit Driving

Maximum travel time

15 min 30 min 45 min

[ Find Resources ]

2 — Halo Map

Big map.

Patient in center.

Instead of necessarily drawing a perfect circle, the shaded Halo represents the area realistically reachable based on transportation.

Pins show:

🍎 Food

🏠 Housing

💳 Benefits

🚌 Transportation

Side panel:

9 matches

Community Food Center

⭐ 96% Halo Match

8 min by bus

🟢 Open

✓ Walk-ins

✓ No ID required

+ Add

3 — Patient Plan

Selected Resources — 4

Reorder them.

Remove ones you don't want.

Then:

[ Print ] [ Text ] [ Email ]

Potentially:

[ Create Halo Route ]

Done.

No complicated case.

No required SDOH assessment.

No patient record unless the clinic actually wants one. call the app halo

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://reachpoint.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37a1d208-3ac3-4a9a-83f0-f73e9388d17b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
