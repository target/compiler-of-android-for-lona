export class NodePath {
  components: string[] = []

  pushComponent(name: string) {
    this.components = [...this.components, name]
  }

  popComponent() {
    this.components = this.components.slice(0, -1)
  }
}
