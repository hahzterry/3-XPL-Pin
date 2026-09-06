import { Listing } from "./listings";

export function createTokenMetadata(
  listing: Listing
) {
  return {
    name: listing.title,

    description:
      listing.description ?? "",

    image:
      listing.imageUrl ?? "",

    attributes: [
      {
        trait_type: "3WORDPIN",
        value: listing.wordPin,
      },
      {
        trait_type: "Asset Type",
        value: listing.type,
      },
    ],
  };
}