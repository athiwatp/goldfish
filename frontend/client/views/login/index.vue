<template>
  <div>
    <div class="tile is-ancestor box is-vertical">
      <div class="tile">

        <!-- Left side -->
        <article class="tile is-parent is-5 is-vertical">

          <!-- Login tile -->
          <article class="tile is-child is-marginless is-paddingless">
            <h1 class="title">Vault Login</h1>
            <div class="box is-parent is-6">
              <form id="form" v-on:submit.prevent="login">

                <div class="control">
                  <label class="label">Authentication Type</label>
                  <div class="select is-fullwidth">
                    <select v-model="type" @change="clearFormData">
                      <option>Token</option>
                      <option>Userpass</option>
                    </select>
                  </div>
                </div>

                <!-- Token login form -->
                <p v-if="type === 'Token'" class="control has-icon">
                  <input class="input" type="password" placeholder="Vault Token" v-model="ID">
                  <span class="icon is-small">
                    <i class="fa fa-lock"></i>
                  </span>
                </p>

                <!-- Userpass login form -->
                <p v-if="type === 'Userpass'" class="control has-icon">
                  <input class="input" type="text" placeholder="Vault Username" v-model="ID">
                  <span class="icon is-small">
                    <i class="fa fa-user-circle-o"></i>
                  </span>
                </p>
                <p v-if="type === 'Userpass'" class="control has-icon">
                  <input class="input" type="password" placeholder="Vault Password" v-model="Password">
                  <span class="icon is-small">
                    <i class="fa fa-lock"></i>
                  </span>
                </p>

                <p class="control">
                  <button type="submit" value="Login" class="button is-primary">
                    Login
                  </button>
                </p>

              </form>
            </div>
          </article>

          <!-- Current session tile -->
          <article class="tile is-child is-marginless is-paddingless">
            <h1 class="title">Current Session</h1>
            <div class="box is-parent is-6">
              <div class="table-responsive">
                <table class="table is-striped is-narrow">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="key in sessionKeys">
                      <td>
                        {{ key }}
                      </td>
                      <td>
                        {{ sessionData[key] }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="sessionData !== null" class="control">
                  <button class="button is-warning" @click="logout()">
                    Logout
                  </button>
                  <button v-if="renewable" class="button is-primary"
                  @click="renewLogin()">
                    Renew
                  </button>
                </p>
              </div>
            </div>
          </article>

        <!-- Left side (end) -->
        </article>


        <!-- Right side -->
        <article class="tile is-parent is-7 is-vertical">

          <!-- Vault Health Tile -->
          <article class="tile is-child is-marginless is-paddingless">
            <h1 class="title">Vault Health</h1>
            <div class="box is-parent is-6">
              <div class="table-responsive">
                <table class="table is-striped is-narrow">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="key in healthKeys">
                      <td>
                        {{ key }}
                      </td>
                      <td>
                        {{ healthData[key] }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p class="control">
                  <button class="button is-primary"
                    v-bind:class="{
                      'is-loading': healthLoading,
                      'is-disabled': healthLoading
                    }"
                    @click="getHealth()">
                  Refresh
                </button>
              </p>
              </div>
            </div>
          </article>

        <!-- Right side (end) -->
        </article>

      </div>

    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      csrf: '',
      type: 'Token',
      ID: '',
      Password: '',
      healthData: {},
      healthLoading: false,
      sessionData: null
    }
  },

  mounted: function () {
    // fetch csrf for login post request later
    this.fetchCSRF()
    // fetch vault cluster details
    this.getHealth()
    // check if user is logged on
    var currentSession = window.localStorage.getItem('session')
    if (currentSession) {
      if (currentSession['cookie_expires_at'] > Date.now()) {
        // login expired
        window.localStorage.removeItem('session')
        this.$notify({
          title: 'Session expired',
          message: 'Please login again',
          type: 'warning'
        })
      } else {
        // login still valid
        this.sessionData = JSON.parse(currentSession)
      }
    }
  },

  computed: {
    healthKeys: function () {
      return Object.keys(this.healthData)
    },
    sessionKeys: function () {
      return (this.sessionData === null) || Object.keys(this.sessionData)
    },
    renewable: function () {
      return (this.sessionData && this.sessionData['renewable'])
    }
  },

  methods: {
    fetchCSRF: function () {
      this.$http.get('/api/login/csrf')
      .then((response) => {
        this.csrf = response.headers['x-csrf-token']
      })
      .catch((error) => {
        this.$onError(error)
      })
    },

    getHealth: function () {
      this.healthLoading = true
      this.$http.get('/api/health')
      .then((response) => {
        this.healthData = JSON.parse(response.data.result)
        this.healthData['server_time_utc'] = new Date(this.healthData['server_time_utc'] * 1000).toUTCString()
        this.healthLoading = false
      })
      .catch((error) => {
        this.$onError(error)
        this.healthLoading = false
      })
    },

    login: function () {
      this.$http.post('/api/login', {
        Type: this.type.toLowerCase(),
        ID: this.ID,
        Password: this.Password
      }, {
        headers: {'X-CSRF-Token': this.csrf}
      })

      .then((response) => {
        // notify user, and clear inputs
        this.$notify({
          title: 'Login success!',
          message: '',
          type: 'success'
        })
        this.clearFormData()

        // set user's session reactively, and store it browser's localStorage
        this.sessionData = {
          'type': this.type,
          'display_name': response.data.data['display_name'],
          'meta': response.data.data['meta'],
          'policies': response.data.data['policies'],
          'renewable': response.data.data['renewable'],
          'token_expiry': response.data.data['ttl'] === 0 ? 'never' : new Date(Date.now() + response.data.data['ttl'] * 1000).toLocaleString(),
          'cookie_expiry': new Date(Date.now() + 28800000).toLocaleString() // 8 hours from now
        }
        window.localStorage.setItem('session', JSON.stringify(this.sessionData))

        // notify user of generated client-token
        if (this.type === 'Userpass') {
          console.log(response.data.data['id'])
          this.$message({
            message: 'Your access token is: ' + response.data.data['id'] + ' and this is the only time you will see it. If you wish, you may login with this to avoid creating unnecessary access tokens in the future.',
            type: 'warning',
            duration: 0,
            showCloseButton: true
          })
        }
      })

      .catch((error) => {
        this.$onError(error)
      })
    },

    logout: function () {
      document.cookie = 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      this.sessionData = null
      window.localStorage.removeItem('session')
    },

    clearFormData: function () {
      this.ID = ''
      this.Password = ''
    },

    renewLogin: function () {
      this.$notify({
        title: 'SoonTM',
        message: 'Feature not implemented yet',
        type: 'warning'
      })
    }
  }
}
</script>

<style scoped>
  .button {
    margin: 5px 0 0;
  }

  .control .button {
    margin: inherit;
  }
</style>
