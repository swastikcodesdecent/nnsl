/**
 * Netaji Nagar Super League - Tournament Configuration
 * Central source of truth for tournament details.
 * Modify parameters here to update tournament-wide information.
 */
export const tournamentConfig = {
    name: "Netaji Nagar Super League",
    shortName: "NNSL",
    tagline: "Football. Competition. Community.",
    description: "A 4-team football tournament bringing players together for an intense grassroots football experience.",
    teams: 4,
    tournamentPeriod: "Late November – Early December",
    tournamentPeriodNote: "Exact dates will be announced separately.",
    feeMin: 1800,
    feeMax: 2250,
    feeType: "Per Team",
    feeNote: "Final participation fee will be announced later.",
    refundPolicy: "If a player withdraws from the tournament at a later stage, only 50% of the applicable participation fee will be refunded.",
    contact: {
        organisersTitle: "Tournament Organisers",
        officialEmail: "swastik.contacts55@gmail.com",
        instagramAccounts: [
            { handle: "rajmalo19", url: "https://instagram.com/rajmalo19", display: "@rajmalo19" },
            { handle: "_pritz_yy", url: "https://instagram.com/_pritz_yy", display: "@_pritz_yy" }
        ],
        instagramHandle: "rajmalo19",
        instagramUrl: "https://instagram.com/rajmalo19",
        instagramHandle2: "_pritz_yy",
        instagramUrl2: "https://instagram.com/_pritz_yy",
        statusMessage: "For official tournament inquiries, reach out via email or Instagram (@rajmalo19 / @_pritz_yy)."
    },
    techPartner: {
        title: "Tech Partner",
        name: "VMC Tech India",
        website: "https://www.vmctechindia.in",
        displayUrl: "www.vmctechindia.in"
    },
    positions: [
        { id: "Goalkeeper", name: "Goalkeeper", icon: "hand", shortDesc: "Last line of defence & box controller" },
        { id: "Defender", name: "Defender", icon: "anchor", shortDesc: "Centre-back, full-back or wing-back" },
        { id: "Midfielder", name: "Midfielder", icon: "compass", shortDesc: "Engine room, playmaker or holding" },
        { id: "Forward", name: "Forward", icon: "target", shortDesc: "Striker, winger or attacking dynamo" },
        { id: "Utility Player", name: "Utility Player", icon: "zap", shortDesc: "Adaptable across multiple tactical positions" }
    ],
    statusOptions: [
        { id: "pending", label: "Pending Review", badgeClass: "badge-pending" },
        { id: "approved", label: "Approved", badgeClass: "badge-approved" },
        { id: "rejected", label: "Rejected", badgeClass: "badge-rejected" },
        { id: "withdrawn", label: "Withdrawn", badgeClass: "badge-withdrawn" }
    ]
};
