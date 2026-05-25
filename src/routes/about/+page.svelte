<script lang="ts">
  import { base } from "$app/paths";
  import {
    H1,
    H2,
    ImageRound,
    Section,
    SectionHeader,
    Text,
  } from "@computational-biology-aachen/design";
</script>

<SectionHeader>
  <div class="header-row">
    <H1 color="light">About Us</H1>
    <a href="https://www.cpbl.rwth-aachen.de/go/id/sazuq/?lidx=1" target="_blank">
      <img
        src="{base}/img/rwth_jp_computational_life_science_bild_rgb.svg"
        alt="RWTH Computational Life Science"
        class="rwth-logo"
      />
    </a>
  </div>
</SectionHeader>

<Section variant="light" width="narrow">
  <div class="about-grid">
    <div class="about-text">
      <Text>
        The idea of GreenSloth has been a dream of the Computational Life Science Group, led by
        Prof. Dr. rer. nat. Matuszyńska, at the RWTH Aachen. We believe in making all our models
        ready for use and strive to make them as accessible as possible. To this end, we dedicate
        entire projects to bringing our field closer to our esteemed scientific colleagues, which is
        why GreenSloth holds significant importance for us.
      </Text>
      <Text>
        To initiate this project, we have assigned Elouen Corvest (<a
          href="mailto:elouen.corvest@rwth-aachen.de">elouen.corvest@rwth-aachen.de</a
        >) to develop the concept of GreenSloth, as he has gained extensive experience with
        photosynthesis models during his time in our Group. We are also proud of his work on
        ComPhot, our teaching tool on computational photosynthesis (<a
          href="https://doi.org/10.1093/plcell/koae101"
          target="_blank">https://doi.org/10.1093/plcell/koae101</a
        >), which he also represented us at the Second European Congress on Photosynthesis (EPS2)
        and even won a poster award.
      </Text>
      <Text>
        Therefore, we are confident in his experience and tenacity in creating GreenSloth to meet
        the expectations of the scientific community. Once his Master's Thesis duties have been
        completed in this project, we, the Group, will take the reins on the maintenance and
        improvement of GreenSloth while staying true to the core that Elouen has built.
      </Text>
      <Text>
        We are very enthusiastic about this project and what it represents. If you have any ideas,
        or even models you wish to be represented here, please write us an email (<a
          href="mailto:elouen.corvest@rwth-aachen.de">elouen.corvest@rwth-aachen.de</a
        >).
      </Text>
    </div>
    <div class="about-photo">
      <ImageRound path="{base}/img/elouen.jpeg" alt="Elouen Corvest" />
    </div>
  </div>
</Section>

<style>
  .header-row {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .rwth-logo {
    height: 3rem;
    filter: brightness(0) invert(1);
  }

  .about-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-8);
    align-items: start;
  }

  @media (max-width: 768px) {
    .about-grid {
      grid-template-columns: 1fr;
    }

    .about-photo {
      justify-self: center;
      max-width: 10rem;
    }
  }

  .about-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
