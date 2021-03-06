<template>
  <div>
    <div class="tile is-ancestor">

      <div class="tile is-parent is-vertical is-6">
        <article class="tile is-child box">
          <div class="table-responsive">
            <table class="table is-striped is-narrow">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Path</th>
                  <th>Def_TTL</th>
                  <th>Max_TTL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(mount, index) in mounts">
                  <td width="68">
                    <a class="tag is-danger is-disabled is-pulled-left">
                      {{ mount.type }}
                    </a>
                  </td>
                  <td>
                    <tooltip v-bind:label="mount.desc" placement="right" type="info" :rounded="true" >
                      <a @click="getMountConfig(index)">
                        {{ mount.path }}
                      </a>
                    </tooltip>
                  </td>
                  <td width="68">
                    <a class="tag is-primary is-disabled is-pulled-left">
                      {{ mount.conf.default_lease_ttl === 0 ? 'Default' : mount.conf.default_lease_ttl }}
                    </a>
                  </td>
                  <td width="68">
                    <a class="tag is-primary is-disabled is-pulled-left">
                      {{ mount.conf.max_lease_ttl === 0 ? 'Default' : mount.conf.max_lease_ttl }}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div class="tile is-parent is-vertical is-6">
        <article class="tile is-child box">
          <h4 class="title is-4">Mount Config</h4>
          <p class="control">
            <textarea class="textarea" placeholder="Select a mount" v-model="mountConfigModified"></textarea>
          </p>
          <p class="control is-pulled-right">
            <a @click="postMountConfig"
            class="button is-primary is-outlined"
            v-bind:class="{ 'is-disabled': (mountConfig === mountConfigModified) }">
              Submit Changes
              <span class="icon is-small">
                <i class="fa fa-check"></i>
              </span>
            </a>
          </p>
        </article>
      </div>

    </div>

  </div>
</template>

<script>
import Tooltip from 'vue-bulma-tooltip'

export default {
  components: {
    Tooltip
  },

  data () {
    return {
      csrf: '',
      mounts: [],
      mountConfig: '',
      mountConfigModified: '',
      selectedIndex: -1
    }
  },

  mounted: function () {
    this.$http.get('/api/mounts').then((response) => {
      this.mounts = []
      this.csrf = response.headers['x-csrf-token']
      let result = response.data.result
      let keys = Object.keys(result)
      for (var i = 0; i < keys.length; i++) {
        this.mounts.push({
          path: keys[i],
          type: result[keys[i]]['type'],
          desc: result[keys[i]]['description'],
          conf: result[keys[i]]['config']
        })
      }
    })
    .catch((error) => {
      this.$onError(error)
    })
  },

  methods: {
    getMountConfig: function (index) {
      this.selectedIndex = index
      this.$http.get('/api/mounts/' + this.mounts[index].path.slice(0, -1))
      .then((response) => {
        this.mountConfig = JSON.stringify(response.data.result, null, 4)
        this.mountConfigModified = this.mountConfig
      })
      .catch((error) => {
        this.$onError(error)
      })
    },

    postMountConfig: function () {
      let address = '/api/mounts/' + this.mounts[this.selectedIndex].path.slice(0, -1)
      let parsed = JSON.parse(this.mountConfigModified)

      this.$http.post(address, {
        default_lease_ttl: parsed.default_lease_ttl.toString(),
        max_lease_ttl: parsed.max_lease_ttl.toString()
      }, {
        headers: {'X-CSRF-Token': this.csrf}
      })

      .then((response) => {
        this.$notify({
          title: 'Success',
          message: 'Mount tuned',
          type: 'success'
        })
        // update page data accordingly
        this.$http.get(address).then((response) => {
          this.mounts[this.selectedIndex].conf = response.data.result
          this.mountConfig = JSON.stringify(response.data.result, null, 4)
          this.mountConfigModified = this.mountConfig
        })
      })

      .catch((error) => {
        this.$onError(error)
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

  .fa-trash-o {
    color: red;
  }

  .fa-info {
    color: lightskyblue;
  }

  .tooltip {
    display: inherit;
  }
</style>
