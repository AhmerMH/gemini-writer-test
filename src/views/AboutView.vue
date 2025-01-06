<template>
  <div class="about">
    <h1>About Content Bridge</h1>
    <div class="description">
      <p>Welcome to Content Bridge - your intelligent content writing companion!</p>

      <div class="features">
        <h2>How it works:</h2>
        <ul>
          <li>Input your keywords</li>
          <li>Fill out quick questionnaires</li>
          <li>Upload screenshots</li>
          <li>Get well-crafted content instantly</li>
        </ul>
      </div>

      <div class="requirements">
        <h2>Getting Started:</h2>
        <p>To use Content Bridge, you'll need to provide your ChatGPT API key to enable the AI-powered content
          generation.</p>
      </div>
    </div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }
}

.description {
  max-width: 800px;
  margin: 2rem auto;
  text-align: center;
}

.features,
.requirements {
  margin: 2rem 0;
  text-align: left;
}

ul {
  list-style-type: disc;
  padding-left: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

h2 {
  color: #42b883;
  margin: 1rem 0;
}
</style>
